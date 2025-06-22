import { NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Opt out of static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

async function authenticateRequest(request) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return new Response(JSON.stringify({ error: 'No token provided' }), { status: 401 })
  }

  const userId = await verifyTokenFromDatabase(token)
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 })
  }

  return userId
}

export async function GET(request) {
  try {
    const userId = await authenticateRequest(request)
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const { data: conversationsData, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, customer_id, customer_name, last_message_at')
      .eq('user_id', userId)

    if (convError) throw convError

    const conversations = []

    for (const conv of conversationsData) {
      const { data: msgs, error: msgsError } = await supabaseAdmin
        .from('messages')
        .select('body, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })

      if (msgsError) throw msgsError

      const lastMsg = msgs[0]
      conversations.push({
        id: conv.id,
        customer_id: conv.customer_id,
        customer_name: conv.customer_name,
        last_message: lastMsg?.body || '',
        last_message_time: lastMsg?.created_at || conv.last_message_at,
        unread_count: 0
      })
    }

    return new Response(JSON.stringify({ conversations }), { status: 200 })
  } catch (error) {
    console.error('Get conversations error:', error)
    return new Response(JSON.stringify({ error: 'Failed to get conversations' }), { status: 500 })
  }
}