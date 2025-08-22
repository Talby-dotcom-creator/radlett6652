/*
  # Rename news_articles table to blog_posts

  This migration renames the existing 'news_articles' table to 'blog_posts'
  and updates all associated database objects (primary key, sequence, constraints,
  indexes, RLS policies, and triggers) to reflect the new name.

  This ensures a clean transition without data loss and maintains all existing
  functionality under the new naming convention.
*/

-- Rename the table
ALTER TABLE public.news_articles RENAME TO blog_posts;

-- Rename the primary key constraint
ALTER TABLE public.blog_posts RENAME CONSTRAINT news_articles_pkey TO blog_posts_pkey;

-- Update RLS policies to reference the new table name
-- Drop existing policies for news_articles
DROP POLICY IF EXISTS "Public can view published public news" ON public.blog_posts;
DROP POLICY IF EXISTS "Members can view all published news" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can manage news" ON public.blog_posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.blog_posts;

-- Recreate policies for blog_posts
CREATE POLICY "Public can view published public blog posts"
  ON public.blog_posts
  FOR SELECT
  TO public
  USING (is_published = true AND NOT is_members_only);

CREATE POLICY "Members can view all published blog posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.member_profiles mp WHERE mp.user_id = auth.uid() AND mp.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.member_profiles mp WHERE mp.user_id = auth.uid() AND mp.role = 'admin'));

-- Update the trigger function and trigger itself
-- First, drop the old trigger
DROP TRIGGER IF EXISTS update_news_articles_updated_at ON public.blog_posts;
DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON public.blog_posts;

-- Recreate the trigger to point to the new table name
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_auto_generate_slug_blog_posts
    BEFORE INSERT OR UPDATE ON public.blog_posts FOR EACH ROW
    EXECUTE FUNCTION auto_generate_slug();

-- Rename indexes
ALTER INDEX IF EXISTS idx_news_articles_category RENAME TO idx_blog_posts_category;
ALTER INDEX IF EXISTS idx_news_articles_featured RENAME TO idx_blog_posts_featured;
ALTER INDEX IF EXISTS idx_news_articles_slug RENAME TO idx_blog_posts_slug;
ALTER INDEX IF EXISTS idx_news_articles_tags RENAME TO idx_blog_posts_tags;
ALTER INDEX IF EXISTS idx_news_publish_date RENAME TO idx_blog_posts_publish_date;
ALTER INDEX IF EXISTS idx_news_published RENAME TO idx_blog_posts_published;
ALTER INDEX IF EXISTS news_articles_pkey RENAME TO blog_posts_pkey;