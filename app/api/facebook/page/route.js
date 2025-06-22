import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    
    
    const token = getTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { data: page, error } = await supabase
      .from('facebook_pages')
      .select('*')
      .eq('user_id', decoded.userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Get Facebook page error:', error)
    return NextResponse.json(
      { error: 'Failed to get Facebook page' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    
    
    const token = getTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { page_id, page_name, access_token } = await request.json()

    if (!page_id || !page_name || !access_token) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Upsert ensures only one page per user
    const { error } = await supabase
      .from('facebook_pages')
      .upsert({
        user_id: decoded.userId,
        page_id,
        page_name,
        access_token
      }, { onConflict: 'user_id' })

    if (error) throw error

    return NextResponse.json({ message: 'Page connected' })
  } catch (error) {
    console.error('Save Facebook page error:', error)
    return NextResponse.json({ error: 'Failed to save page' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    
    
    const token = getTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('facebook_pages')
      .delete()
      .eq('user_id', decoded.userId)

    if (error) {
      throw error
    }

    return NextResponse.json({ message: 'Page integration deleted successfully' })
  } catch (error) {
    console.error('Delete Facebook page error:', error)
    return NextResponse.json(
      { error: 'Failed to delete Facebook page integration' },
      { status: 500 }
    )
  }
}