'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Phone, User, Facebook, MessageSquare, BarChart3, Users } from 'lucide-react'

export default function DashboardPage() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      loadCustomerDetails(selectedConversation.customer_id)
    }
  }, [selectedConversation])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
  }

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/conversations', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        if (data.conversations && data.conversations.length > 0) {
          setSelectedConversation(data.conversations[0])
        }
      } else {
        console.error('Failed to fetch conversations')
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId) => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const loadCustomerDetails = async (customerId) => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCustomer(data.customer)
      }
    } catch (error) {
      console.error('Error loading customer details:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      })
      
      if (response.ok) {
        setNewMessage('')
        loadMessages(selectedConversation.id)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Left Sidebar */}
      <div className="w-16 bg-blue-700 flex flex-col items-center py-4 space-y-4">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <Facebook className="w-6 h-6 text-blue-700" />
        </div>
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-blue-600 cursor-pointer">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-blue-600 cursor-pointer">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <Button variant="ghost" size="sm">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={conversation.customer_avatar} />
                      <AvatarFallback>{conversation.customer_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.customer_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(conversation.last_message_time)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">Facebook DM</p>
                    <p className="text-sm text-gray-700 truncate">
                      {conversation.last_message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConversation.customer_avatar} />
                  <AvatarFallback>{selectedConversation.customer_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.customer_name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {customer?.status || 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                      {message.sender_id !== 'agent' && (
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarImage src={selectedConversation.customer_avatar} />
                          <AvatarFallback>{selectedConversation.customer_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <div
                          className={`px-3 py-2 rounded-lg ${
                            message.sender_id === 'agent'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.body}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.sender_name} - {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${selectedConversation.customer_name || 'user'}`}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Sidebar */}
      {selectedConversation && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="text-center mb-6">
            <Avatar className="w-20 h-20 mx-auto mb-4">
              <AvatarImage src={selectedConversation.customer_avatar} />
              <AvatarFallback className="text-2xl">
                {selectedConversation.customer_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold text-gray-900">
              {selectedConversation.customer_name || 'Unknown User'}
            </h3>
            <p className="text-sm text-gray-500">
              {customer?.status || 'Offline'}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Customer details</h4>
            
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-sm font-medium text-gray-900">
                {customer?.email || 'amit@richpanel.com'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">First Name</p>
              <p className="text-sm font-medium text-gray-900">
                {customer?.first_name || selectedConversation.customer_name?.split(' ')[0] || 'Amit'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Last Name</p>
              <p className="text-sm font-medium text-gray-900">
                {customer?.last_name || selectedConversation.customer_name?.split(' ')[1] || 'RG'}
              </p>
            </div>

            <Button variant="link" className="text-blue-600 p-0 h-auto">
              View more details
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}