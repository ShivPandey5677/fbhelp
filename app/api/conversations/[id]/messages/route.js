import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken, verifyTokenFromDatabase } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { FacebookAPI } from '@/lib/facebook'

export async function GET(request, { params }) {
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const userId = await verifyTokenFromDatabase(token)
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const userId = await verifyTokenFromDatabase(token)
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { message } = await request.json()
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get conversation to find page_id
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('page_id, customer_id')
      .eq('id', params.id)
      .single()

    if (convError || !conversation) {
      throw new Error('Conversation not found')
    }

    // Save to database
    const { data: savedMessage, error: saveError } = await supabaseAdmin
      .from('messages')
      .insert([
        {
          conversation_id: params.id,
          sender_type: 'agent',
          body: message,
          customer_id: conversation.customer_id,
          page_id: conversation.page_id
        }
      ])
      .select()
      .single()

    if (saveError) throw saveError

    // Send via Facebook API
    const fbApi = new FacebookAPI()
    await fbApi.sendMessage({
      recipient: { id: conversation.customer_id },
      message: { text: message }
    })

    return NextResponse.json({ message: savedMessage })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
