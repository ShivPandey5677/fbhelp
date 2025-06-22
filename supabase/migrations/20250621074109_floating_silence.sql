/*
  # Create Facebook Helpdesk Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `password` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `facebook_pages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `page_id` (text, Facebook page ID)
      - `page_name` (text)
      - `access_token` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `customers`
      - `id` (uuid, primary key)
      - `facebook_id` (text, unique)
      - `name` (text)
      - `email` (text)
      - `first_name` (text)
      - `last_name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `conversations`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `page_id` (uuid, foreign key to facebook_pages)
      - `status` (text, default 'active')
      - `last_message_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `sender_type` (text, 'customer' or 'agent')
      - `sender_id` (text)
      - `content` (text)
      - `facebook_message_id` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create facebook_pages table
CREATE TABLE IF NOT EXISTS facebook_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  page_id text NOT NULL,
  page_name text NOT NULL,
  access_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_id text UNIQUE NOT NULL,
  name text DEFAULT '',
  email text DEFAULT '',
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  page_id uuid REFERENCES facebook_pages(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'agent')),
  sender_id text NOT NULL,
  content text NOT NULL,
  facebook_message_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can manage own facebook pages"
  ON facebook_pages
  FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can read customers through their pages"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN facebook_pages fp ON c.page_id = fp.id
      WHERE c.customer_id = customers.id
      AND fp.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage conversations through their pages"
  ON conversations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_pages fp
      WHERE fp.id = conversations.page_id
      AND fp.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage messages through their conversations"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN facebook_pages fp ON c.page_id = fp.id
      WHERE c.id = messages.conversation_id
      AND fp.user_id::text = auth.uid()::text
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_pages_user_id ON facebook_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_page_id ON conversations(page_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);