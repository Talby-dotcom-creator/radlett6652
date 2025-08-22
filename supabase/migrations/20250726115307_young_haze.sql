/*
  # Update RLS policies for public access to events and news

  This migration updates the Row Level Security policies for events and news_articles
  to allow public (unauthenticated) users to view published content, while maintaining
  admin-only access for management operations.

  ## Changes Made:
  1. Events table: Add public SELECT policy for non-members-only events
  2. News articles table: Add public SELECT policy for published, non-members-only articles
  3. Maintain existing authenticated policies for members-only content
  4. Keep admin-only policies for content management

  ## Security Notes:
  - Public users can only view published content that is not marked as members-only
  - Members-only content still requires authentication
  - All management operations (INSERT, UPDATE, DELETE) still require admin privileges
*/

-- Update events table policies
-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Members can view all events" ON events;

-- Add new public policy for non-members-only events
CREATE POLICY "Public can view public events"
  ON events
  FOR SELECT
  TO public
  USING (NOT is_members_only AND NOT is_past_event);

-- Add policy for authenticated users to view all events (including members-only)
CREATE POLICY "Members can view all events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

-- Update news_articles table policies
-- First, drop the existing restrictive policy if it exists
DROP POLICY IF EXISTS "Members can view published news" ON news_articles;

-- Add new public policy for published, non-members-only articles
CREATE POLICY "Public can view published public news"
  ON news_articles
  FOR SELECT
  TO public
  USING (is_published = true AND NOT is_members_only);

-- Add policy for authenticated users to view all published news (including members-only)
CREATE POLICY "Members can view all published news"
  ON news_articles
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Ensure other tables that should be publicly accessible have appropriate policies

-- Officers table - public can view active officers
DROP POLICY IF EXISTS "Members can view active officers" ON officers;

CREATE POLICY "Public can view active officers"
  ON officers
  FOR SELECT
  TO public
  USING (is_active = true);

-- Testimonials table - public can view published testimonials
DROP POLICY IF EXISTS "Members can view published testimonials" ON testimonials;

CREATE POLICY "Public can view published testimonials"
  ON testimonials
  FOR SELECT
  TO public
  USING (is_published = true);

-- FAQ items table - public can view published FAQs
DROP POLICY IF EXISTS "Members can view published FAQs" ON faq_items;

CREATE POLICY "Public can view published FAQs"
  ON faq_items
  FOR SELECT
  TO public
  USING (is_published = true);

-- Site settings table - public can view settings (for contact info, etc.)
DROP POLICY IF EXISTS "Members can view site settings" ON site_settings;

CREATE POLICY "Public can view site settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

-- Page content table - public can view page content
DROP POLICY IF EXISTS "Members can view page content" ON page_content;

CREATE POLICY "Public can view page content"
  ON page_content
  FOR SELECT
  TO public
  USING (true);