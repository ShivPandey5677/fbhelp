import { NextResponse } from 'next/server'
import { getTokenFromRequest, generateAndStoreToken, getTokenByUserId } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid';

// Function to verify token from the database
async function verifyTokenFromDatabase(token) {
    const { data, error } = await supabase
        .from('tokens')
        .select('user_id, expires_at')
        .eq('token', token)
        .single();

    if (error || !data || new Date(data.expires_at) < new Date()) {
        return null;
    }
    return data.user_id;
}

export async function GET(request) {
    try {
        const token = getTokenFromRequest(request);
        console.log('Retrieved token from request:', token);
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
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

        const { data: page, error } = await supabase
            .from('facebook_pages')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return NextResponse.json({ page });
    } catch (error) {
        console.error('Get Facebook page error:', error);
        return NextResponse.json({ error: 'Failed to get Facebook page' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const userId = await verifyTokenFromDatabase(token);
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        console.log('Token verified for user:', userId);

        // Retrieve token using userId
        const userToken = await getTokenByUserId(userId);
        if (!userToken) {
            return NextResponse.json({ error: 'Failed to retrieve user token' }, { status: 401 });
        }

        console.log('User token retrieved:', userToken);

        const { page_id, page_name, access_token } = await request.json();
        if (!page_id || !page_name || !access_token) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const { error } = await supabase
            .from('facebook_pages')
            .upsert({
                user_id: userId,
                page_id,
                page_name,
                access_token
            }, { onConflict: 'user_id' });

        if (error) throw error;
        return NextResponse.json({ message: 'Page connected' });
    } catch (error) {
        console.error('Save Facebook page error:', error);
        return NextResponse.json({ error: 'Failed to save page' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const token = getTokenFromRequest(request);
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const userId = await verifyTokenFromDatabase(token);
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        console.log('Token verified for user:', userId);

        // Retrieve token using userId
        const userToken = await getTokenByUserId(userId);
        if (!userToken) {
            return NextResponse.json({ error: 'Failed to retrieve user token' }, { status: 401 });
        }

        console.log('User token retrieved:', userToken);

        const { error } = await supabase
            .from('facebook_pages')
            .delete()
            .eq('user_id', userId);

        if (error) {
            throw error;
        }

        return NextResponse.json({ message: 'Page integration deleted successfully' });
    } catch (error) {
        console.error('Delete Facebook page error:', error);
        return NextResponse.json({ error: 'Failed to delete Facebook page integration' }, { status: 500 });
    }
}