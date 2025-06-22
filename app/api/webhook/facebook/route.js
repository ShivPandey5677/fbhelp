import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    console.log('Facebook webhook verified')
    return new NextResponse(challenge)
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    if (body.object === 'page') {
      for (const entry of body.entry) {
        const webhookEvent = entry.messaging[0]
        console.log('Received webhook event:', webhookEvent)
        
        // Persist conversation and message in database
        const senderId = webhookEvent.sender.id
        const senderName = webhookEvent.sender.name || 'Facebook User'
        const pageId = entry.id // page id that received the message
        const messageText = webhookEvent.message.text
        const now = new Date().toISOString()

        // 1. Find last conversation with this customer within 24h
        const { data: existingConv, error: convErr } = await supabaseAdmin
          .from('conversations')
          .select('*')
          .eq('page_id', pageId)
          .eq('customer_id', senderId)
          .order('last_message_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        let conversationId
        if (!convErr && existingConv && new Date(now) - new Date(existingConv.last_message_at) < 24 * 60 * 60 * 1000) {
          conversationId = existingConv.id
          await supabaseAdmin
            .from('conversations')
            .update({ last_message_at: now })
            .eq('id', conversationId)
        } else {
          // create new
          const { data: newConv } = await supabaseAdmin
            .from('conversations')
            .insert({
              page_id: pageId,
              customer_id: senderId,
              customer_name: senderName,
              last_message_at: now
            })
            .select()
            .single()
          conversationId = newConv.id
        }

        // 2. Insert message
        await supabaseAdmin.from('messages').insert({
          conversation_id: conversationId,
          sender_id: senderId,
          sender_name: senderName,
          body: messageText,
          created_at: now
        })
        
        if (webhookEvent.message) {
          // Process incoming message
          console.log('Incoming message:', webhookEvent.message.text)
          
          // You would typically:
          // 1. Find or create a conversation
          // 2. Save the message to the database
          // 3. Notify connected agents
        }
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}