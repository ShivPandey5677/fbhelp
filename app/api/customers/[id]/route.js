import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken, verifyTokenFromDatabase } from '@/lib/auth'

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

    const customerId = params.id

    // Mock customer data
    const customers = {
      'amit_rg': {
        id: 'amit_rg',
        first_name: 'Amit',
        last_name: 'RG',
        email: 'amit@richpanel.com',
        status: 'Offline',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=100&h=100&fit=crop&crop=face'
      },
      'hiten_saxena': {
        id: 'hiten_saxena',
        first_name: 'Hiten',
        last_name: 'Saxena',
        email: 'hiten@richpanel.com',
        status: 'Online',
        avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?w=100&h=100&fit=crop&crop=face'
      }
    }

    const customer = customers[customerId]

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Get customer error:', error)
    return NextResponse.json(
      { error: 'Failed to get customer details' },
      { status: 500 }
    )
  }
}