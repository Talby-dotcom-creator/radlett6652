/*
  # Blog Management Enhancements

  1. New Columns for Enhanced Blog Features
    - Add optional category field for better organization
    - Add tags field for content tagging
    - Add author field for attribution
    - Add featured flag for highlighting important posts
    - Add view_count for analytics
    - Add slug field for SEO-friendly URLs

  2. Indexes
    - Add indexes for better query performance on new fields

  3. Sample Data
    - Add some sample blog categories and tags
*/

-- Add new columns to news_articles table for enhanced blog functionality
ALTER TABLE public.news_articles 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS author TEXT,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_featured ON public.news_articles(featured);
CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON public.news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_tags ON public.news_articles USING GIN(tags);

-- Create a function to generate URL-friendly slugs
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate slug from title
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
    
    -- Ensure slug is unique by appending number if necessary
    DECLARE
      base_slug TEXT := NEW.slug;
      counter INTEGER := 1;
    BEGIN
      WHILE EXISTS (SELECT 1 FROM public.news_articles WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')) LOOP
        NEW.slug := base_slug || '-' || counter;
        counter := counter + 1;
      END LOOP;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for slug generation
DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON public.news_articles;
CREATE TRIGGER trigger_auto_generate_slug
  BEFORE INSERT OR UPDATE ON public.news_articles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slug();

-- Update existing articles to have slugs
UPDATE public.news_articles 
SET slug = generate_slug(title) 
WHERE slug IS NULL OR slug = '';

-- Add some sample categories and update existing articles
UPDATE public.news_articles 
SET 
  category = CASE 
    WHEN title ILIKE '%installation%' OR title ILIKE '%master%' THEN 'lodge-news'
    WHEN title ILIKE '%charity%' OR title ILIKE '%donation%' THEN 'charity'
    WHEN title ILIKE '%barbecue%' OR title ILIKE '%social%' OR title ILIKE '%event%' THEN 'events'
    ELSE 'general'
  END,
  tags = CASE 
    WHEN title ILIKE '%installation%' THEN ARRAY['installation', 'ceremony', 'officers']
    WHEN title ILIKE '%charity%' THEN ARRAY['charity', 'community', 'fundraising']
    WHEN title ILIKE '%barbecue%' THEN ARRAY['social', 'family', 'community']
    ELSE ARRAY['lodge', 'news']
  END,
  author = 'Lodge Secretary'
WHERE category IS NULL OR category = 'general';

-- Set the most recent article as featured
UPDATE public.news_articles 
SET featured = true 
WHERE id = (
  SELECT id FROM public.news_articles 
  WHERE is_published = true 
  ORDER BY publish_date DESC 
  LIMIT 1
);