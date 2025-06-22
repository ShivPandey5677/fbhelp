import { NextResponse } from 'next/server'
import { exchangeCodeForToken, FacebookAPI } from '@/lib/facebook'
import { verifyToken, supabaseAdmin } from '@/lib/auth'

// Opt out of static generation
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic'

export const runtime = 'nodejs' // Ensure this runs on Node.js runtime

export const fetchCache = 'force-no-store' // Prevent caching of this route

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url, `http://${request.headers.get('host')}`)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.redirect('/integration?error=no_code')
    }

    // Exchange code for user access token
    const tokenData = await exchangeCodeForToken(code)
    const userAccessToken = tokenData.access_token

    // state carries our JWT so we know which user connected page
    const decoded = verifyToken(state || '')
    if (!decoded) {
      throw new Error('Invalid state')
    }

    // Fetch pages the user manages
    const fb = new FacebookAPI(userAccessToken)
    const pagesResp = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`)
    const pagesJson = await pagesResp.json()
    if (!pagesResp.ok) {
      throw new Error('Failed to fetch pages')
    }
    const page = pagesJson.data?.[0]
    if (!page) {
      throw new Error('No page found')
    }

    // Save / upsert in facebook_pages table
    await supabaseAdmin.from('facebook_pages').upsert({
      user_id: decoded.userId,
      page_id: page.id,
      page_name: page.name,
      access_token: page.access_token
    }, { onConflict: 'user_id' })
    
    // Use absolute URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/integration?success=true`)
  } catch (error) {
    console.error('Facebook callback error:', error)
    // Use absolute URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/integration?error=callback_failed`)
  }
}