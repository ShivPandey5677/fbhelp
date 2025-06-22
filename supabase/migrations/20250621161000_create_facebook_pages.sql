-- Migration: create facebook_pages table to store connected FB pages per user

CREATE TABLE IF NOT EXISTS public.facebook_pages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    page_id text NOT NULL,
    page_name text NOT NULL,
    access_token text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.facebook_pages ENABLE ROW LEVEL SECURITY;

-- Allow only owner (authenticated with same user_id) to select/update/delete
CREATE POLICY "facebook_pages_auth_select" ON public.facebook_pages
  FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "facebook_pages_auth_modify" ON public.facebook_pages
  FOR UPDATE USING ( auth.uid() = user_id );

CREATE POLICY "facebook_pages_auth_delete" ON public.facebook_pages
  FOR DELETE USING ( auth.uid() = user_id );

-- Service role can do anything (already implicit)
