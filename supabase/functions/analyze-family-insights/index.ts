import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const openaiKey = Deno.env.get('OPENAI_API_KEY')

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Fetch all families
        const { data: families, error: familiesError } = await supabase
            .from('families')
            .select('id, name')

        if (familiesError) throw familiesError

        const results = []

        for (const family of families) {
            // 2. Detect signals
            const { data: signals, error: signalsError } = await supabase.rpc('detect_family_signals', {
                p_family_id: family.id
            })

            if (signalsError) {
                console.error(`Error detecting signals for family ${family.id}:`, signalsError)
                continue
            }

            if (signals && signals.length > 0) {
                // 3. Generate content via AI
                // We'll bundle signals for better context
                const signalsSummary = signals.map(s => `- ${s.explanation} (${s.recommended_action})`).join('\n')

                const prompt = `
          You are the "AI Guardian" for a behavior change app called Task For Time. 
          Your goal is to provide supportive, calm, and non-judgmental insights to parents based on detected behavioral patterns.

          FAMILY: ${family.name}
          SIGNALS DETECTED:
          ${signalsSummary}

          TASK:
          Write a single, cohesive "Family Health Insight" that summarizes these signals and provides a supportive nudge. 
          
          TONE CONSTRAINTS:
          - Supportive and Calm
          - Non-judgmental (no guilt)
          - No "you should" or "must"
          - Focused on the "Trust Model" (positive reinforcement)
          
          Format the response as a clear, encouraging 2-3 sentence insight.
        `

                let message = ''
                if (openaiKey) {
                    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${openaiKey}`,
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o-mini',
                            messages: [
                                { role: 'system', content: 'You are a supportive family coach. Write in a calm, encouraging, and non-judgmental tone.' },
                                { role: 'user', content: prompt }
                            ],
                            temperature: 0.7,
                        }),
                    })

                    const aiData = await aiResponse.json()
                    message = aiData.choices[0]?.message?.content || 'We noticed some patterns in your family habits. Remember that fast approvals and positive reinforcement are key to building trust!'
                } else {
                    // Fallback to a default message if AI key is missing
                    message = signals[0].explanation + ' ' + signals[0].recommended_action
                }

                // 4. Store the insight
                // We'll associate it with the first signal type for now, or use 'general'
                const { error: insertError } = await supabase
                    .from('ai_family_insights')
                    .insert({
                        family_id: family.id,
                        signal_type: signals[0].signal_type,
                        severity: signals[0].severity,
                        message: message,
                        child_id: signals[0].child_id
                    })

                if (insertError) {
                    console.error(`Error inserting insight for family ${family.id}:`, insertError)
                } else {
                    results.push({ family_id: family.id, status: 'insight_created' })
                }
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
