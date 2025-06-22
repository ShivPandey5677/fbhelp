-- Migration: create conversations and messages tables for Facebook helpdesk

-- Conversations table stores distinct chat threads per customer per page within rolling 24h
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id text NOT NULL,
    customer_id text NOT NULL,
    customer_name text,
    last_message_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Index to quickly find the latest conversation of a customer for a page
CREATE INDEX IF NOT EXISTS conversations_page_customer_idx ON public.conversations(page_id, customer_id, last_message_at DESC);

-- Messages table stores individual message events
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id text NOT NULL,
    sender_name text,
    body text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: allow service role inserts, deny others (adjust later if needed)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role" ON public.conversations FOR ALL USING ( auth.role() = 'service_role' );
CREATE POLICY "Allow service role" ON public.messages FOR ALL USING ( auth.role() = 'service_role' );
