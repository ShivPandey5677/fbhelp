import { NextResponse } from 'next/server'
import { supabase } from '@/lib/auth'
import { verifyTokenFromDatabase } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      return NextResponse.json(
        { error: error.message || 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Get the user's profile from the public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      console.error('Error fetching user profile:', userError)
      return NextResponse.json(
        { error: 'Error fetching user profile' },
        { status: 500 }
      )
    }

    // Retrieve the token for the user
    const token = await verifyTokenFromDatabase(data.user.id);
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to retrieve token' },
        { status: 500 }
      );
    }

    const res = NextResponse.json({
      message: 'Login successful',
      token: token,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email
      }
    })

    // Also store the JWT in an HttpOnly cookie
    res.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}