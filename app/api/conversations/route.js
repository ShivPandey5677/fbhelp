import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyTokenFromDatabase, getTokenByUserId, supabaseAdmin } from '@/lib/auth'
import { FacebookAPI } from '@/lib/facebook'

// Opt out of static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const userId = await verifyTokenFromDatabase(token);
    if (!userId) {
      console.error('Invalid token or token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Token verified for user:', userId);

    // Retrieve token using userId
    const userToken = await getTokenByUserId(userId);
    if (!userToken) {
      return NextResponse.json({ error: 'Failed to retrieve user token' }, { status: 401 });
    }

    console.log('User token retrieved:', userToken);

    // Fetch user pages
    const { data: pagesData, error: pagesError } = await supabaseAdmin
      .from('facebook_pages')
      .select('page_id, page_name, access_token')
      .eq('user_id', userId)

    if (pagesError) throw pagesError
    if (!pagesData.length) {
      return NextResponse.json({ conversations: [] })
    }

    const pageIds = pagesData.map(p => p.page_id)

    // Get conversations for these pages, order by last_message_at desc
    const { data: convs, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .in('page_id', pageIds)
      .order('last_message_at', { ascending: false })

    if (convError) throw convError

    // For each conversation fetch latest message (could be optimized with SQL)
    const conversations = []
    for (const conv of convs) {
      const { data: msgs, error: msgError } = await supabaseAdmin
        .from('messages')
        .select('body, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (msgError) throw msgError

      const lastMsg = msgs[0]
      conversations.push({
        id: conv.id,
        customer_id: conv.customer_id,
        customer_name: conv.customer_name,
        last_message: lastMsg?.body || '',
        last_message_time: lastMsg?.created_at || conv.last_message_at,
        unread_count: 0 // Placeholder, implement read tracking later
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