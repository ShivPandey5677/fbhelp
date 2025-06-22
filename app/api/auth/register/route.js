import { NextResponse } from 'next/server'
import { createUser } from '@/lib/auth'
import { supabase } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Create the user using our auth function
    const user = await createUser(name, email, password)
    
    // The user will need to confirm their email before logging in
    return NextResponse.json({
      message: 'Registration successful! Please check your email to confirm your account.',
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        emailConfirmed: false
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}