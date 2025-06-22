import { NextResponse } from 'next/server'
import { generateFacebookLoginURL } from '@/lib/facebook'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') || ''
    const loginURL = generateFacebookLoginURL(token)
    return NextResponse.redirect(loginURL)
  } catch (error) {
    console.error('Facebook auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Facebook login URL' },
      { status: 500 }
    )
  }
}