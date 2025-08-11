import { supabase } from './supabase';
import { 
  CMSEvent, 
  CMSNewsArticle, 
  CMSOfficer, 
  CMSTestimonial, 
  CMSFAQItem, 
  CMSSiteSetting, 
  CMSPageContent 
} from '../types';

// Helper function to add timeout to promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 300000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export const cmsApi = {
  // Events
  getEvents: async (): Promise<CMSEvent[]> => {
    try {
      console.log('🔍 CMS API: Fetching events...');
      const query = supabase
        .from('events')
        .select('id, title, description, event_date, location, is_members_only, is_past_event')
        .order('event_date', { ascending: true });
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error fetching events:', error);
        throw new Error(`Failed to fetch events: ${error.message}`);
      }
      
      console.log('✅ CMS API: Events loaded successfully:', data?.length || 0, 'events');
      return data as CMSEvent[];
    } catch (error) {
      console.error('CMS API Error - getEvents:', error);
      throw error;
    }
  },

  getNextUpcomingEvent: async (): Promise<CMSEvent | null> => {
    try {
      const now = new Date().toISOString();
      const query = supabase
        .from('events')
        .select('id, title, description, event_date, location, is_members_only, is_past_event')
        .eq('is_past_event', false)
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(1);
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error fetching next upcoming event:', error);
        throw new Error(`Failed to fetch next upcoming event: ${error.message}`);
      }
      
      return data && data.length > 0 ? data[0] as CMSEvent : null;
    } catch (error) {
      console.error('CMS API Error - getNextUpcomingEvent:', error);
      throw error;
    }
  },

  createEvent: async (event: Omit<CMSEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CMSEvent> => {
    try {
      const query = supabase
        .from('events')
        .insert(event)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error creating event:', error);
        throw new Error(`Failed to create event: ${error.message}`);
      }
      
      return data as CMSEvent;
    } catch (error) {
      console.error('CMS API Error - createEvent:', error);
      throw error;
    }
  },

  updateEvent: async (id: string, event: Partial<CMSEvent>): Promise<CMSEvent> => {
    try {
      const query = supabase
        .from('events')
        .update(event)
        .eq('id', id)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error updating event:', error);
        throw new Error(`Failed to update event: ${error.message}`);
      }
      
      return data as CMSEvent;
    } catch (error) {
      console.error('CMS API Error - updateEvent:', error);
      throw error;
    }
  },

  deleteEvent: async (id: string): Promise<void> => {
    try {
      const query = supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      const { error } = await withTimeout(query);
      
      if (error) {
        console.error('Error deleting event:', error);
        throw new Error(`Failed to delete event: ${error.message}`);
      }
    } catch (error) {
      console.error('CMS API Error - deleteEvent:', error);
      throw error;
    }
  },

  // News Articles
  getNewsArticles: async (): Promise<CMSNewsArticle[]> => {
    try {
      console.log('🔍 CMS API: Fetching news articles...');
      const query = supabase
        .from('blog_posts')
        .select('id, title, summary, content, image_url, publish_date, is_members_only, is_published, created_at')
        .order('publish_date', { ascending: false });
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error fetching news articles:', error);
        throw new Error(`Failed to fetch news articles: ${error.message}`);
      }
      
      console.log('✅ CMS API: News articles loaded successfully:', data?.length || 0, 'articles');
      return data as CMSNewsArticle[];
    } catch (error) {
      console.error('CMS API Error - getNewsArticles:', error);
      throw error;
    }
  },

  createNewsArticle: async (article: Omit<CMSNewsArticle, 'id' | 'created_at' | 'updated_at'>): Promise<CMSNewsArticle> => {
    try {
      const query = supabase
        .from('blog_posts')
        .insert(article)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error creating news article:', error);
        throw new Error(`Failed to create news article: ${error.message}`);
      }
      
      return data as CMSNewsArticle;
    } catch (error) {
      console.error('CMS API Error - createNewsArticle:', error);
      throw error;
    }
  },

  updateNewsArticle: async (id: string, article: Partial<CMSNewsArticle>): Promise<CMSNewsArticle> => {
    try {
      const query = supabase
        .from('blog_posts')
        .update(article)
        .eq('id', id)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error updating news article:', error);
        throw new Error(`Failed to update news article: ${error.message}`);
      }
      
      return data as CMSNewsArticle;
    } catch (error) {
      console.error('CMS API Error - updateNewsArticle:', error);
      throw error;
    }
  },

  deleteNewsArticle: async (id: string): Promise<void> => {
    try {
      const query = supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      const { error } = await withTimeout(query);
      
      if (error) {
        console.error('Error deleting news article:', error);
        throw new Error(`Failed to delete news article: ${error.message}`);
      }
    } catch (error) {
      console.error('CMS API Error - deleteNewsArticle:', error);
      throw error;
    }
  },

  // Officers
  getOfficers: async (): Promise<CMSOfficer[]> => {
    try {
      console.log('🔍 CMS API: Fetching officers...');
      const query = supabase
        .from('officers')
        .select('id, position, full_name, image_url, sort_order, is_active')
        .order('sort_order', { ascending: true });
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error fetching officers:', error);
        throw new Error(`Failed to fetch officers: ${error.message}`);
      }
      
      console.log('✅ CMS API: Officers loaded successfully:', data?.length || 0, 'officers');
      return data as CMSOfficer[];
    } catch (error) {
      console.error('CMS API Error - getOfficers:', error);
      throw error;
    }
  },

  createOfficer: async (officer: Omit<CMSOfficer, 'id' | 'created_at' | 'updated_at'>): Promise<CMSOfficer> => {
    try {
      const query = supabase
        .from('officers')
        .insert(officer)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error creating officer:', error);
        throw new Error(`Failed to create officer: ${error.message}`);
      }
      
      return data as CMSOfficer;
    } catch (error) {
      console.error('CMS API Error - createOfficer:', error);
      throw error;
    }
  },

  updateOfficer: async (id: string, officer: Partial<CMSOfficer>): Promise<CMSOfficer> => {
    try {
      const query = supabase
        .from('officers')
        .update(officer)
        .eq('id', id)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error updating officer:', error);
        throw new Error(`Failed to update officer: ${error.message}`);
      }
      
      return data as CMSOfficer;
    } catch (error) {
      console.error('CMS API Error - updateOfficer:', error);
      throw error;
    }
  },

  deleteOfficer: async (id: string): Promise<void> => {
    try {
      const query = supabase
        .from('officers')
        .delete()
        .eq('id', id);
      
      const { error } = await withTimeout(query);
      
      if (error) {
        console.error('Error deleting officer:', error);
        throw new Error(`Failed to delete officer: ${error.message}`);
      }
    } catch (error) {
      console.error('CMS API Error - deleteOfficer:', error);
      throw error;
    }
  },

  // Testimonials
  getTestimonials: async (): Promise<CMSTestimonial[]> => {
    try {
      console.log('🔍 CMS API: Fetching testimonials...');
      const query = supabase
        .from('testimonials')
        .select('id, member_name, content, image_url, is_published, sort_order')
        .order('sort_order', { ascending: true });
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error fetching testimonials:', error);
        throw new Error(`Failed to fetch testimonials: ${error.message}`);
      }
      
      console.log('✅ CMS API: Testimonials loaded successfully:', data?.length || 0, 'testimonials');
      return data as CMSTestimonial[];
    } catch (error) {
      console.error('CMS API Error - getTestimonials:', error);
      throw error;
    }
  },

  createTestimonial: async (testimonial: Omit<CMSTestimonial, 'id' | 'created_at' | 'updated_at'>): Promise<CMSTestimonial> => {
    try {
      const query = supabase
        .from('testimonials')
        .insert(testimonial)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error creating testimonial:', error);
        throw new Error(`Failed to create testimonial: ${error.message}`);
      }
      
      return data as CMSTestimonial;
    } catch (error) {
      console.error('CMS API Error - createTestimonial:', error);
      throw error;
    }
  },

  updateTestimonial: async (id: string, testimonial: Partial<CMSTestimonial>): Promise<CMSTestimonial> => {
    try {
      const query = supabase
        .from('testimonials')
        .update(testimonial)
        .eq('id', id)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error updating testimonial:', error);
        throw new Error(`Failed to update testimonial: ${error.message}`);
      }
      
      return data as CMSTestimonial;
    } catch (error) {
      console.error('CMS API Error - updateTestimonial:', error);
      throw error;
    }
  },

  deleteTestimonial: async (id: string): Promise<void> => {
    try {
      const query = supabase
        .from('testimonials')
        .delete()
        .eq('id', id);
      
      const { error } = await withTimeout(query);
      
      if (error) {
        console.error('Error deleting testimonial:', error);
        throw new Error(`Failed to delete testimonial: ${error.message}`);
      }
    } catch (error) {
      console.error('CMS API Error - deleteTestimonial:', error);
      throw error;
    }
  },

  // FAQ Items
  getFAQItems: async (): Promise<CMSFAQItem[]> => {
    try {
      console.log('🔍 CMS API: Fetching FAQ items...');
      const query = supabase
        .from('faq_items')
        .select('id, question, answer, sort_order, is_published')
        .order('sort_order', { ascending: true });
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error fetching FAQ items:', error);
        throw new Error(`Failed to fetch FAQ items: ${error.message}`);
      }
      
      console.log('✅ CMS API: FAQ items loaded successfully:', data?.length || 0, 'items');
      return data as CMSFAQItem[];
    } catch (error) {
      console.error('CMS API Error - getFAQItems:', error);
      throw error;
    }
  },

  createFAQItem: async (faq: Omit<CMSFAQItem, 'id' | 'created_at' | 'updated_at'>): Promise<CMSFAQItem> => {
    try {
      const query = supabase
        .from('faq_items')
        .insert(faq)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error creating FAQ item:', error);
        throw new Error(`Failed to create FAQ item: ${error.message}`);
      }
      
      return data as CMSFAQItem;
    } catch (error) {
      console.error('CMS API Error - createFAQItem:', error);
      throw error;
    }
  },

  updateFAQItem: async (id: string, faq: Partial<CMSFAQItem>): Promise<CMSFAQItem> => {
    try {
      const query = supabase
        .from('faq_items')
        .update(faq)
        .eq('id', id)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error updating FAQ item:', error);
        throw new Error(`Failed to update FAQ item: ${error.message}`);
      }
      
      return data as CMSFAQItem;
    } catch (error) {
      console.error('CMS API Error - updateFAQItem:', error);
      throw error;
    }
  },

  deleteFAQItem: async (id: string): Promise<void> => {
    try {
      const query = supabase
        .from('faq_items')
        .delete()
        .eq('id', id);
      
      const { error } = await withTimeout(query);
      
      if (error) {
        console.error('Error deleting FAQ item:', error);
        throw new Error(`Failed to delete FAQ item: ${error.message}`);
      }
    } catch (error) {
      console.error('CMS API Error - deleteFAQItem:', error);
      throw error;
    }
  },

  // Site Settings
  getSiteSettings: async (): Promise<CMSSiteSetting[]> => {
    try {
      console.log('🔍 CMS API: Fetching site settings...');
      const query = supabase
        .from('site_settings')
        .select('id, setting_key, setting_value, setting_type, description')
        .order('setting_key', { ascending: true });
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error fetching site settings:', error);
        throw new Error(`Failed to fetch site settings: ${error.message}`);
      }
      
      console.log('✅ CMS API: Site settings loaded successfully:', data?.length || 0, 'settings');
      return data as CMSSiteSetting[];
    } catch (error) {
      console.error('CMS API Error - getSiteSettings:', error);
      throw error;
    }
  },

  updateSiteSetting: async (key: string, value: string): Promise<CMSSiteSetting> => {
    try {
      const query = supabase
        .from('site_settings')
        .update({ setting_value: value })
        .eq('setting_key', key)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error updating site setting:', error);
        throw new Error(`Failed to update site setting: ${error.message}`);
      }
      
      return data as CMSSiteSetting;
    } catch (error) {
      console.error('CMS API Error - updateSiteSetting:', error);
      throw error;
    }
  },

  // Page Content
  getPageContent: async (pageName?: string): Promise<CMSPageContent[]> => {
    try {
      console.log('🔍 CMS API: Fetching page content...');
      let query = supabase
        .from('page_content')
        .select('id, page_name, section_name, content_type, content, updated_at');
      
      if (pageName) {
        query = query.eq('page_name', pageName);
      }
      
      query = query.order('page_name', { ascending: true });
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error fetching page content:', error);
        throw new Error(`Failed to fetch page content: ${error.message}`);
      }
      
      console.log('✅ CMS API: Page content loaded successfully:', data?.length || 0, 'pages');
      return data as CMSPageContent[];
    } catch (error) {
      console.error('CMS API Error - getPageContent:', error);
      throw error;
    }
  },

  updatePageContent: async (pageName: string, sectionName: string, content: string): Promise<CMSPageContent> => {
    try {
      const query = supabase
        .from('page_content')
        .upsert({
          page_name: pageName, 
          section_name: sectionName, 
          content: content,
          content_type: 'text'
        }, {
          onConflict: 'page_name,section_name'
        })
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error updating page content:', error);
        throw new Error(`Failed to update page content: ${error.message}`);
      }
      
      return data as CMSPageContent;
    } catch (error) {
      console.error('CMS API Error - updatePageContent:', error);
      throw error;
    }
  },

  // Get content counts for all types
  getContentCounts: async (): Promise<Record<string, number>> => {
    try {
      console.log('🔍 CMS API: Fetching content counts...');
      
      // Fetch counts for all content types in parallel
      const [
        eventsResult,
        newsResult,
        officersResult,
        testimonialsResult,
        faqResult,
        settingsResult,
        pageContentResult
      ] = await Promise.allSettled([
        supabase.from('events').select('count', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('count', { count: 'exact', head: true }),
        supabase.from('officers').select('count', { count: 'exact', head: true }),
        supabase.from('testimonials').select('count', { count: 'exact', head: true }),
        supabase.from('faq_items').select('count', { count: 'exact', head: true }),
        supabase.from('site_settings').select('count', { count: 'exact', head: true }),
        supabase.from('page_content').select('count', { count: 'exact', head: true })
      ]);

      const counts: Record<string, number> = {
        events: eventsResult.status === 'fulfilled' ? eventsResult.value.count || 0 : 0,
        news: newsResult.status === 'fulfilled' ? newsResult.value.count || 0 : 0,
        officers: officersResult.status === 'fulfilled' ? officersResult.value.count || 0 : 0,
        testimonials: testimonialsResult.status === 'fulfilled' ? testimonialsResult.value.count || 0 : 0,
        faq: faqResult.status === 'fulfilled' ? faqResult.value.count || 0 : 0,
        settings: settingsResult.status === 'fulfilled' ? settingsResult.value.count || 0 : 0,
        pages: pageContentResult.status === 'fulfilled' ? pageContentResult.value.count || 0 : 0
      };

      console.log('✅ CMS API: Content counts loaded:', counts);
      return counts;
    } catch (error) {
      console.error('CMS API Error - getContentCounts:', error);
      throw error;
    }
  },

  createPageContent: async (pageContent: Omit<CMSPageContent, 'id' | 'updated_at'>): Promise<CMSPageContent> => {
    try {
      const query = supabase
        .from('page_content')
        .insert(pageContent)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query);
      
      if (error) {
        console.error('Error creating page content:', error);
        throw new Error(`Failed to create page content: ${error.message}`);
      }
      
      return data as CMSPageContent;
    } catch (error) {
      console.error('CMS API Error - createPageContent:', error);
      throw error;
    }
  },

  // Bulk initialize default page content
  initializeDefaultPageContent: async (): Promise<void> => {
    try {
      const defaultContent = [
        // Homepage
        { page_name: 'homepage', section_name: 'hero_title', content_type: 'text', content: 'Radlett Lodge No. 6652' },
        { page_name: 'homepage', section_name: 'hero_subtitle', content_type: 'text', content: 'Integrity, Friendship, Respect and Service' },
        { page_name: 'homepage', section_name: 'welcome_title', content_type: 'text', content: 'Welcome to Our Lodge' },
        { page_name: 'homepage', section_name: 'welcome_text', content_type: 'html', content: '<p>Founded in 1948, Radlett Lodge No. 6652 is a vibrant Masonic Lodge operating under the United Grand Lodge of England within the Province of Hertfordshire.</p><p>Our Lodge is committed to fostering personal development, ethical conduct, and charitable endeavors among our members while maintaining the rich traditions of Freemasonry.</p>' },
        
        // Join page
        { page_name: 'join', section_name: 'intro_title', content_type: 'text', content: 'Becoming a Freemason' },
        { page_name: 'join', section_name: 'intro_subtitle', content_type: 'text', content: 'Freemasonry welcomes men of good character who believe in a Supreme Being and want to contribute to their communities.' },
        { page_name: 'join', section_name: 'intro_paragraph_1', content_type: 'html', content: '<p>Joining Radlett Lodge is the beginning of a lifelong journey of personal development, fellowship, and service. Our members come from all walks of life, backgrounds, and beliefs, united by shared values and a desire to make a positive impact on the world.</p>' },
        { page_name: 'join', section_name: 'intro_paragraph_2', content_type: 'html', content: '<p>The process of becoming a Freemason is thoughtful and deliberate. We take time to get to know potential members, and for them to get to know us, ensuring that Freemasonry is the right path for each individual.</p>' },
        { page_name: 'join', section_name: 'requirements_intro', content_type: 'text', content: 'To be eligible for membership in Radlett Lodge No. 6652, you must meet the following criteria:' },
        { page_name: 'join', section_name: 'financial_intro', content_type: 'html', content: '<p>Membership in Radlett Lodge, as with all Masonic Lodges, involves certain financial obligations. These typically include:</p>' },
        
        // About page
        { page_name: 'about', section_name: 'history_title', content_type: 'text', content: 'Our History' },
        { page_name: 'about', section_name: 'history_intro', content_type: 'html', content: '<p>A journey through time: Exploring the rich heritage of Radlett Lodge No. 6652 since 1948.</p>' },
        { page_name: 'about', section_name: 'founding_story', content_type: 'html', content: '<p>Radlett Lodge No. 6652 was founded by a diverse group of friends residing in Radlett in the aftermath of World War II. The founding members included a doctor, a local businessman, a farmer, and a Savile Row tailor, among others. Facing a significant waiting list at the existing local lodge, they petitioned to form a new lodge that would meet on Saturdays.</p>' },
        
        // Contact page
        { page_name: 'contact', section_name: 'intro_text', content_type: 'text', content: 'We welcome your inquiries about Radlett Lodge and Freemasonry.' },
        { page_name: 'contact', section_name: 'visiting_info', content_type: 'html', content: '<p>If you\'re a Freemason planning to visit Radlett Lodge, please contact our Secretary beforehand. Proof of membership in a recognized Masonic Lodge will be required.</p>' }
      ];
      // Use upsert to avoid conflicts with existing content
      for (const content of defaultContent) {
        await cmsApi.updatePageContent(content.page_name, content.section_name, content.content);
      }
      
    } catch (error) {
      console.error('CMS API Error - initializeDefaultPageContent:', error);
      throw error;
    }
  }
};