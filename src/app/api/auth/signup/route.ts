import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OWNER_EMAIL } from '@/lib/premium';

/**
 * Server-side signup handler that bypasses RLS using service role key.
 * This is necessary because after signUp(), the user's session may not be
 * immediately available for RLS policies.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Signup API] Missing Supabase configuration');
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

    // Step 1: Create auth user
    console.log('[Signup API] Creating auth user...');
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for development
    });

    if (signUpError) {
      console.error('[Signup API] Auth error:', signUpError);
      return NextResponse.json(
        { error: signUpError.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No user returned from signup' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    console.log('[Signup API] User created:', userId);

    // Step 2: Create family (using service role, bypasses RLS)
    console.log('[Signup API] Creating family...');
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .insert({
        name: 'My Family',
        created_by: userId
      })
      .select()
      .single();

    if (familyError) {
      console.error('[Signup API] Family error:', familyError);
      // Clean up: delete the auth user if family creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: familyError.message || 'Failed to create family' },
        { status: 500 }
      );
    }

    console.log('[Signup API] Family created:', family.id);

    // Step 3: Create profile - check if trial columns exist first
    console.log('[Signup API] Creating profile...');

    // Base profile data (always required)
    const baseProfileData: Record<string, unknown> = {
      id: userId,
      role: 'parent',
      display_name: email.split('@')[0],
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
      is_owner: email.toLowerCase() === OWNER_EMAIL.toLowerCase()
    };

    let { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(fullProfileData);

    // If trial columns don't exist, try without them
    if (profileError?.message?.includes('column') || profileError?.message?.includes('schema cache')) {
      console.log('[Signup API] Trial columns not found, creating basic profile...');
      const { error: basicProfileError } = await supabaseAdmin
        .from('profiles')
        .insert(baseProfileData);
      profileError = basicProfileError;
    }

    if (profileError) {
      console.error('[Signup API] Profile error:', profileError);
      // Clean up: delete family and auth user
      await supabaseAdmin.from('families').delete().eq('id', family.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: profileError.message || 'Failed to create profile' },
        { status: 500 }
      );
    }

    console.log('[Signup API] Profile created successfully');

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId
    });

  } catch (error: any) {
    console.error('[Signup API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
