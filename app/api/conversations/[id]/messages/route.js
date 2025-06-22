import { NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { FacebookAPI } from '@/lib/facebook'

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

export async function GET(request, { params }) {
  try {
    const userId = await authenticateRequest(request)
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return new Response(JSON.stringify({ messages }), { status: 200 })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const userId = await authenticateRequest(request)
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const { message } = await request.json()
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 })
    }

    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (convError) throw convError

    const { data: savedMessage, error: saveError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: params.id,
        body: message,
        customer_id: conversation.customer_id,
        page_id: conversation.page_id
      })
      .select()
      .single()

    if (saveError) throw saveError

    const fbApi = new FacebookAPI()
    await fbApi.sendMessage({
      recipient: { id: conversation.customer_id },
      message: { text: message }
    })

    return new Response(JSON.stringify({ message: savedMessage }), { status: 200 })
  } catch (error) {
    console.error('Error sending message:', error)
    return new Response(JSON.stringify({ error: 'Failed to send message' }), { status: 500 })
  }
}
