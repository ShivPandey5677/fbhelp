import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with the auth token from the request
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Opt out of static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json(
      { error: 'No token provided' },
      { status: 401 }
    )
  }

  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !authUser) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }

  return authUser.id
}

export async function GET(request) {
  try {
    const userId = await authenticateRequest(request)
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single()

    if (error) throw error
    if (!user) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), { status: 404 })
    }

    return new Response(JSON.stringify(user), { status: 200 })
  } catch (error) {
    console.error('Auth check error:', error)
    return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 401 })
  }
}