import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const FALLBACK_URL = 'https://tdhkpvattuvffhjwfywl.supabase.co'
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkaGtwdmF0dHV2ZmZoandmeXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTk5NzUsImV4cCI6MjA4Mjg3NTk3NX0.IPayWZJjsLDt6di1D7BMQL1LpHIu-x1TJZTgiF5cw7c'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY

// Log to verify (remove in production)
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

// Create Supabase client
// Note: The client is configured to NOT auto-refresh tokens on errors
// Auth is only cleared on explicit signOut() calls
// Database errors (401/403 from RLS) do NOT invalidate the session
export const supabase: any = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Persist session in localStorage (default behavior)
        persistSession: true,
        // Auto-refresh tokens before they expire
        autoRefreshToken: true,
        // Detect session from URL (for OAuth callbacks)
        detectSessionInUrl: true,
    }
})

/**
 * Helper function to check if a Supabase error is an auth expiry error
 * Use this to determine if we should redirect to login
 * 
 * IMPORTANT: RLS policy failures (403) are NOT auth expiry errors!
 * Only use this for actual session/token expiry.
 */
export function isSessionExpiredError(error: any): boolean {
    if (!error) return false;

    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';

    // Only these specific errors indicate true session expiry:
    // - JWT expired
    // - Invalid refresh token (can't refresh)
    // - Session not found
    return (
        message.includes('jwt expired') ||
        message.includes('invalid refresh token') ||
        message.includes('session not found') ||
        message.includes('user not found') ||
        code === 'session_expired' ||
        code === 'invalid_jwt'
    );
}

/**
 * Helper to check if an error is a database/RLS error (NOT an auth error)
 * These should NOT trigger logout
 */
export function isDatabaseError(error: any): boolean {
    if (!error) return false;

    const message = error.message?.toLowerCase() || '';
    const code = error.code || '';

    // RLS violations, permission errors, constraint violations are database errors
    // They do NOT mean the user is logged out
    return (
        message.includes('violates row-level security') ||
        message.includes('permission denied') ||
        message.includes('violates') ||
        code.startsWith('42') || // PostgreSQL syntax/permission errors
        code.startsWith('23') || // PostgreSQL constraint violations
        code === 'PGRST' || // PostgREST errors
        (error.code && !code.startsWith('auth'))
    );
}
