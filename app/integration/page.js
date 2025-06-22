'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function IntegrationPage() {
  const [user, setUser] = useState(null)
  const [fbPage, setFbPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadFacebookPage()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    }
  }

  const loadFacebookPage = async () => {
    const token = localStorage.getItem('token')
    console.log('Loading Facebook page with token:', token ? '[token exists]' : 'no token')
    
    try {
      const response = await fetch('/api/facebook/page', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Facebook page response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Facebook page data:', data)
        setFbPage(data.page)
      } else {
        const errorData = await response.text()
        console.error('Error response:', errorData)
      }
    } catch (error) {
      console.error('Error loading Facebook page:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectPage = () => {
    const token = localStorage.getItem('token')
  window.location.href = `/api/auth/facebook?token=${encodeURIComponent(token || '')}`
  }

  const handleDeleteIntegration = async () => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/facebook/page', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setFbPage(null)
      }
    } catch (error) {
      console.error('Error deleting integration:', error)
    }
  }

  const handleReplyToMessages = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Facebook Page Integration
            </h1>
          </div>

          {!fbPage ? (
            <div className="text-center">
              <Button
                onClick={handleConnectPage}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Connect Page
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-1">Integrated Page:</p>
                <p className="text-xl font-semibold text-gray-900">{fbPage.name}</p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={handleDeleteIntegration}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  Delete Integration
                </Button>
                
                <Button
                  onClick={handleReplyToMessages}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  Reply To Messages
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}