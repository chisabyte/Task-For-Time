import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPremiumStatus } from '@/lib/premium';

// Initialized lazily
export async function POST(request: NextRequest) {
  try {
    const { childId, outcomeId, lookbackDays = 14 } = await request.json();
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated: Missing Authorization header' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Create a client with the user's token to ensure RLS/auth policies work
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Check premium status (server-side enforcement)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, trial_ends_at, is_owner')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Premium access logic: use single source of truth
    const premiumStatus = getPremiumStatus({
      plan: profile.plan || 'trial',
      trialEndsAt: profile.trial_ends_at,
      isOwner: profile.is_owner || false,
      email: user.email
    });

    if (!premiumStatus.isPremiumActive) {
      return NextResponse.json({
        error: 'Premium feature - paid plans launching soon',
        requiresPremium: true
      }, { status: 403 });
    }

    // Get signals (deterministic)
    const { data: signalsData, error: signalsError } = await supabase.rpc('generate_coaching_signals', {
      p_child_id: childId || null,
      p_outcome_id: outcomeId || null,
      p_lookback_days: lookbackDays,
    });

    if (signalsError) {
      console.error('Signal Generation Error:', signalsError);
      return NextResponse.json({ error: `Signal generation failed: ${signalsError.message}` }, { status: 500 });
    }

    // Get metrics
    let metricsData = null;
    if (childId) {
      const { data, error: metricsError } = await supabase.rpc('compute_outcome_metrics', {
        p_child_id: childId,
        p_outcome_id: outcomeId || null,
        p_start_date: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_end_date: new Date().toISOString().split('T')[0],
      });

      if (!metricsError) {
        metricsData = data;
      } else {
        console.warn('Metrics computation error (non-fatal):', metricsError);
      }
    }

    // For now, use OpenAI API (user should set OPENAI_API_KEY in env)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      // Return deterministic insights based on signals only (no LLM)
      return NextResponse.json({
        signals: signalsData?.signals || {},
        insights: generateDeterministicInsights(signalsData?.signals || {}),
        metrics: metricsData,
      });
    }

    // Build prompt for LLM
    const prompt = buildCoachingPrompt(signalsData?.signals || {}, metricsData);

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use cheaper model for coaching
        messages: [
          {
            role: 'system',
            content: 'You are a behavior change coach for families. Provide data-driven, actionable recommendations. Always explain WHY with data. Use the strict template: Observation (data-backed), Diagnosis (why), Recommendation (actionable), Expected result, Next check (metric to watch). No generic advice. No punishments or shame language.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error('OpenAI error:', error);
      // Fallback to deterministic insights
      return NextResponse.json({
        signals: signalsData?.signals || {},
        insights: generateDeterministicInsights(signalsData?.signals || {}),
        metrics: metricsData,
      });
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0]?.message?.content || '';

    // Parse AI response into structured format
    const insights = parseAIResponse(aiResponse, signalsData?.signals || {});

    return NextResponse.json({
      signals: signalsData?.signals || {},
      insights,
      metrics: metricsData,
    });
  } catch (error: any) {
    console.error('Coaching generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate coaching' }, { status: 500 });
  }
}

function buildCoachingPrompt(signals: any, metrics: any): string {
  let prompt = 'Analyze the following behavior data and provide coaching recommendations.\n\n';

  prompt += 'SIGNALS DETECTED:\n';
  prompt += JSON.stringify(signals, null, 2) + '\n\n';

  if (metrics) {
    prompt += 'METRICS:\n';
    prompt += JSON.stringify(metrics, null, 2) + '\n\n';
  }

  prompt += `Provide recommendations using this EXACT format:
  
OBSERVATION: [Data-backed observation]
DIAGNOSIS: [Why this is happening]
RECOMMENDATION: [One actionable step from allowed set: adjust schedule, split tasks, reduce load, increase frequency/reduce reward, add auto-approval, add first-then rule, add cutoff times, add catch-up day]
EXPECTED RESULT: [What should improve]
NEXT CHECK: [Metric to watch]

If multiple signals exist, prioritize the one with highest impact.`;

  return prompt;
}

function parseAIResponse(response: string, signals: any): any {
  // Simple parsing - in production, use structured output or better parsing
  const observation = extractSection(response, 'OBSERVATION');
  const diagnosis = extractSection(response, 'DIAGNOSIS');
  const recommendation = extractSection(response, 'RECOMMENDATION');
  const expectedResult = extractSection(response, 'EXPECTED RESULT');
  const nextCheck = extractSection(response, 'NEXT CHECK');

  return {
    observation: observation || 'No specific observation',
    diagnosis: diagnosis || 'No diagnosis provided',
    recommendation: recommendation || 'Review patterns and adjust approach',
    expected_result: expectedResult || 'Improved metrics',
    next_check: nextCheck || 'Completion rate',
    impact_score: calculateImpactScore(signals),
  };
}

function extractSection(text: string, section: string): string | null {
  const regex = new RegExp(`${section}:\\s*([^\\n]+(?:\\n(?!\\w+:)[^\\n]+)*)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function calculateImpactScore(signals: any): number {
  let score = 0;
  if (signals.evening_slump) score += 30;
  if (signals.approval_drag) score += 25;
  if (signals.overload) score += 35;
  if (signals.weekend_regression) score += 20;
  return Math.min(score, 100);
}

function generateDeterministicInsights(signals: any): any {
  if (Object.keys(signals).length === 0) {
    return {
      observation: 'No significant patterns detected in the last 14 days.',
      diagnosis: 'Behavior patterns are within normal range.',
      recommendation: 'Continue current approach and monitor trends.',
      expected_result: 'Maintain current performance levels.',
      next_check: 'Weekly completion rate',
      impact_score: 0,
    };
  }

  const insights = [];
  if (signals.evening_slump) {
    insights.push({
      observation: 'Completion rate drops significantly after 7pm (25%+ lower than baseline).',
      diagnosis: 'Evening fatigue or competing activities reduce task completion.',
      recommendation: 'Adjust schedule: move critical tasks earlier in the day or reduce evening task load.',
      expected_result: 'Improved completion rate and reduced stress.',
      next_check: 'Evening completion rate vs baseline',
      impact_score: 30,
    });
  }

  if (signals.approval_drag) {
    insights.push({
      observation: `Approval latency is ${signals.approval_drag} minutes (above 60min threshold).`,
      diagnosis: 'Delayed approvals reduce motivation and break momentum.',
      recommendation: 'Add auto-approval rules for high-reliability tasks or set approval reminders.',
      expected_result: 'Faster reward delivery and improved motivation.',
      next_check: 'Approval latency (median minutes)',
      impact_score: 25,
    });
  }

  if (signals.overload) {
    insights.push({
      observation: 'Daily task load is 30%+ higher than historical median.',
      diagnosis: 'Too many tasks assigned may cause overwhelm and reduced completion.',
      recommendation: 'Reduce daily load or split tasks into smaller steps.',
      expected_result: 'Higher completion rate and reduced stress.',
      next_check: 'Daily completion rate',
      impact_score: 35,
    });
  }

  if (signals.weekend_regression) {
    insights.push({
      observation: 'Weekend completion rate is 20%+ lower than weekdays.',
      diagnosis: 'Weekend routines differ from weekday routines, affecting consistency.',
      recommendation: 'Adjust weekend expectations or create weekend-specific routines.',
      expected_result: 'Improved weekend consistency.',
      next_check: 'Weekend vs weekday completion rate',
      impact_score: 20,
    });
  }

  // Return highest impact insight
  return insights.sort((a, b) => b.impact_score - a.impact_score)[0] || {
    observation: 'Patterns detected but no specific recommendation.',
    diagnosis: 'Further analysis needed.',
    recommendation: 'Monitor trends and adjust as needed.',
    expected_result: 'Improved understanding of patterns.',
    next_check: 'Overall completion rate',
    impact_score: 10,
  };
}

