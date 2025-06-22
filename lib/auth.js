import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

// Create a separate admin client for server-side operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Make sure this is set in your environment
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Regular client for client-side operations
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
)

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verify a JWT token and return the decoded user ID if valid.
 * 
 * @param {string} token - The JWT token to verify.
 * @returns {object|null} The decoded user ID if the token is valid, otherwise null.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Extract JWT token from a Next.js Request.
 * - Looks for an Authorization header of the form "Bearer <token>" (case-insensitive).
 * - Falls back to a "token" cookie so normal navigation requests can be authenticated too.
 * 
 * @param {object} request - The Next.js Request object.
 * @returns {string} The extracted JWT token.
 */
export function getTokenFromRequest(request) {
  if (!request) {
    console.log('getTokenFromRequest: No request object provided')
    return ''
  }

  // 1. Authorization header
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  console.log('Auth header:', authHeader)

  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    console.log('Extracted token from header:', token ? '[token exists]' : 'empty')
    return token
  }

  // 2. Cookie fallback
  console.log('No Authorization header found, checking cookies')
  const cookies = request.cookies
  console.log('All cookies:', cookies)
  const tokenCookie = cookies.get('token')?.value || ''
  console.log('Token from cookie:', tokenCookie ? '[token exists]' : 'empty')
  return tokenCookie
  try {
    return request.cookies?.get('token')?.value || ''
  } catch {
    return ''
  }
}

export async function getUser(email) {
  // First try to get the user from Supabase Auth
  const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserByEmail(email)

  if (authError || !user) return null

  // Then get the user from the public.users table
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return null
  return data
}

export async function createUser(name, email, password) {
  // First, sign up the user with Supabase Auth
  // Create user directly (confirmed) via Admin API
  const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name
    }
  })

  if (signUpError) {
    console.error('Create user error:', signUpError)
    throw new Error(signUpError.message)
  }

  // Then create a corresponding user in the public.users table
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .insert([
      {
        id: authData.user.id,
        name,
        email,
        created_at: new Date().toISOString()
      }
    ])
    .select()
    .single()

  if (userError) {
    console.error('User creation error:', userError)
    // If user creation fails, delete the auth user to keep things clean
    try {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    } catch (deleteError) {
      console.error('Error cleaning up auth user:', deleteError)
    }
    throw new Error(userError.message)
  }

  return userData
}

export async function verifyTokenFromDatabase(token) {
  console.log('Verifying token:', token);
  const { data, error } = await supabaseAdmin
    .from('tokens')
    .select('user_id, expires_at')
    .eq('token', token)
    .single();

  if (error) {
    console.error('Error retrieving token from database:', error);
    return null;
  }
  if (!data || new Date(data.expires_at) < new Date()) {
    console.log('Token is invalid or expired');
    return null;
  }
  console.log('Token is valid for user:', data.user_id);
  return data.user_id;
}