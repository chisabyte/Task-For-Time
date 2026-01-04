import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OWNER_EMAIL } from '@/lib/premium';

/**
 * Server-side profile creation handler that bypasses RLS using service role key.
 * Used for OAuth users who need to create a profile after signing in.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, role, displayName } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'parent' && role !== 'child') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "parent" or "child"' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Create Profile API] Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the user exists in auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData.user) {
      console.error('[Create Profile API] User not found:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 409 }
      );
    }

    // Create family (using service role, bypasses RLS)
    console.log('[Create Profile API] Creating family...');
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .insert({
        name: role === 'parent' ? 'My Family' : 'Family',
        created_by: userId
      })
      .select()
      .single();

    if (familyError) {
      console.error('[Create Profile API] Family error:', familyError);
      return NextResponse.json(
        { error: familyError.message || 'Failed to create family' },
        { status: 500 }
      );
    }

    console.log('[Create Profile API] Family created:', family.id);

    // Create profile - check if trial columns exist first
    const finalDisplayName = displayName || (role === 'parent' ? 'Parent' : 'Child');

    // Try to create profile with trial columns first
    console.log('[Create Profile API] Creating profile...');

    // Base profile data (always required)
    const baseProfileData: Record<string, unknown> = {
      id: userId,
      role: role,
      display_name: finalDisplayName,
      family_id: family.id,
    };

    // Try with trial columns first
    const trialStartsAt = new Date().toISOString();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const fullProfileData = {
      ...baseProfileData,
      trial_starts_at: trialStartsAt,
      trial_ends_at: trialEndsAt.toISOString(),
      plan: 'trial',
      // Automatically set is_owner for owner email
      is_owner: userData.user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()
    };

    let { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(fullProfileData);

    // If trial columns don't exist, try without them
    if (profileError?.message?.includes('column') || profileError?.message?.includes('schema cache')) {
      console.log('[Create Profile API] Trial columns not found, creating basic profile...');
      const { error: basicProfileError } = await supabaseAdmin
        .from('profiles')
        .insert(baseProfileData);
      profileError = basicProfileError;
    }

    if (profileError) {
      console.error('[Create Profile API] Profile error:', profileError);
      // Clean up: delete family
      await supabaseAdmin.from('families').delete().eq('id', family.id);
      return NextResponse.json(
        { error: profileError.message || 'Failed to create profile' },
        { status: 500 }
      );
    }

    console.log('[Create Profile API] Profile created successfully');

    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      familyId: family.id
    });

  } catch (error: any) {
    console.error('[Create Profile API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
