import { NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { FacebookAPI } from '@/lib/facebook'

// Opt out of static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

async function authenticateRequest(request) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 })
  }

  const userId = await verifyTokenFromDatabase(token)
  if (!userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  return userId
}

export async function GET(request) {
  try {
    const userId = await authenticateRequest(request)
    if (!userId) return

    const { data: pagesData, error: pagesError } = await supabaseAdmin
      .from('facebook_pages')
      .select('page_id, page_name, access_token')
      .eq('user_id', userId)

    if (pagesError) throw pagesError

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

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to get conversations' },
      { status: 500 }
    )
  }
}