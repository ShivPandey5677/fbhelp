export class FacebookAPI {
  constructor(accessToken) {
    this.accessToken = accessToken
    this.baseURL = 'https://graph.facebook.com/v18.0'
  }

  async sendMessage(recipientId, message) {
    const response = await fetch(`${this.baseURL}/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    return response.json()
  }

  async getPageInfo(pageId) {
    const response = await fetch(`${this.baseURL}/${pageId}?fields=name,id&access_token=${this.accessToken}`)
    
    if (!response.ok) {
      throw new Error('Failed to get page info')
    }

    return response.json()
  }

  async getUserProfile(userId) {
    const response = await fetch(`${this.baseURL}/${userId}?fields=first_name,last_name,profile_pic&access_token=${this.accessToken}`)
    
    if (!response.ok) {
      throw new Error('Failed to get user profile')
    }

    return response.json()
  }
}

export function generateFacebookLoginURL(state = '') {
  const appId = process.env.FACEBOOK_APP_ID
  const redirectUri = encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/auth/facebook/callback`)
  const scope = encodeURIComponent('pages_manage_metadata,pages_messaging,pages_read_engagement')
  const stateParam = state ? `&state=${encodeURIComponent(state)}` : ''
  return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code${stateParam}`
}

export async function exchangeCodeForToken(code) {
  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/facebook/callback`

  const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`)
  
  if (!response.ok) {
    throw new Error('Failed to exchange code for token')
  }

  return response.json()
}