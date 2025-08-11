import { supabase } from './supabase';
import { dataCache, deduplicateRequest, CACHE_KEYS } from './dataCache';
import { MemberProfile, LodgeDocument, MeetingMinutes, CMSEvent, CMSNewsArticle, CMSOfficer, CMSTestimonial, CMSFAQItem, CMSSiteSetting, CMSPageContent } from '../types';

// Helper function to add timeout to promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 300000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export const optimizedApi = {
  // Optimized member profiles with caching
  getMemberProfile: async (userId: string): Promise<MemberProfile | null> => {
    const cacheKey = `member_profile:${userId}`;
    const timeoutDuration = 120000; // Increase timeout to 2 minutes
    return dataCache.get(cacheKey, async () => {      
      const query = supabase
        .from('member_profiles')
        .select('*')
        .eq('user_id', userId)
        .limit(1);
      
      const { data, error } = await withTimeout(query, timeoutDuration);
      
      if (error) {
        console.error('Error fetching member profile:', error);
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }
      
      return data && data.length > 0 ? data[0] as MemberProfile : null;
    }, 10 * 60 * 1000); // 10 minute cache for profiles
  },

  getAllMembers: async (): Promise<MemberProfile[]> => {
    return deduplicateRequest(CACHE_KEYS.MEMBERS, () =>
      dataCache.get(CACHE_KEYS.MEMBERS, async () => {
        const query = supabase
          .from('member_profiles')
          .select('*')
          .order('full_name', { ascending: true });
        
        const { data, error } = await withTimeout(query, 60000);
        
        if (error) {
          console.error('Error fetching all members:', error);
          throw new Error(`Failed to fetch members: ${error.message}`);
        }
        
        return data as MemberProfile[];
      }, 15 * 60 * 1000) // 15 minute cache for member list
    );
  },

  // Optimized documents with category-specific caching
  getLodgeDocuments: async (category?: string): Promise<LodgeDocument[]> => {
    const cacheKey = category ? CACHE_KEYS.DOCUMENTS_BY_CATEGORY(category) : CACHE_KEYS.DOCUMENTS;
    
    return deduplicateRequest(cacheKey, () =>
      dataCache.get(cacheKey, async () => {
        let query = supabase
          .from('lodge_documents')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (category) {
          query = query.eq('category', category);
        }
        
        const { data, error } = await withTimeout(query, 45000);
        
        if (error) {
          console.error('Error fetching lodge documents:', error);
          throw new Error(`Failed to fetch documents: ${error.message}`);
        }
        
        return data as LodgeDocument[];
      }, 20 * 60 * 1000) // 20 minute cache for documents
    );
  },

  // Create a new document
  createDocument: async (document: Omit<LodgeDocument, 'id' | 'created_at' | 'updated_at'>): Promise<LodgeDocument> => {
    try {
      const query = supabase
        .from('lodge_documents')
        .insert(document)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query, 45000);
      
      if (error) {
        console.error('Error creating document:', error);
        throw new Error(`Failed to create document: ${error.message}`);
      }
      
      // Invalidate relevant caches
      optimizedApi.invalidateCache.documents(document.category);
      
      return data as LodgeDocument;
    } catch (error) {
      console.error('API Error - createDocument:', error);
      throw error;
    }
  },
  
  // Update an existing document
  updateDocument: async (id: string, document: Partial<LodgeDocument>): Promise<LodgeDocument> => {
    try {
      const query = supabase
        .from('lodge_documents')
        .update(document)
        .eq('id', id)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query, 45000);
      
      if (error) {
        console.error('Error updating document:', error);
        throw new Error(`Failed to update document: ${error.message}`);
      }
      
      // Invalidate relevant caches
      optimizedApi.invalidateCache.documents(document.category);
      
      return data as LodgeDocument;
    } catch (error) {
      console.error('API Error - updateDocument:', error);
      throw error;
    }
  },
  
  // Delete a document
  deleteDocument: async (id: string): Promise<void> => {
    try {
      // First, get the document to know which category cache to invalidate
      const { data: document, error: getError } = await supabase
        .from('lodge_documents')
        .select('category')
        .eq('id', id)
        .single();
      
      if (getError) {
        console.error('Error getting document before deletion:', getError);
      }
      
      const { error } = await supabase
        .from('lodge_documents')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting document:', error);
        throw new Error(`Failed to delete document: ${error.message}`);
      }
      
      // Invalidate all document caches to be safe
      optimizedApi.invalidateCache.documents();
      
      // Also invalidate the specific category cache if we know it
      if (document && document.category) {
        optimizedApi.invalidateCache.documents(document.category);
      }
    } catch (error) {
      console.error('API Error - deleteDocument:', error);
      throw error;
    }
  },

  // Paginated documents for better performance
  getLodgeDocumentsPaginated: async (
    page: number = 1, 
    limit: number = 20, 
    category?: string
  ): Promise<{ documents: LodgeDocument[], total: number, hasMore: boolean }> => {
    const offset = (page - 1) * limit;
    const cacheKey = `documents_paginated:${page}:${limit}:${category || 'all'}`;
    
    return deduplicateRequest(cacheKey, () =>
      dataCache.get(cacheKey, async () => {
        let query = supabase
          .from('lodge_documents')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (category) {
          query = query.eq('category', category);
        }
        
        const { data, error, count } = await withTimeout(query, 45000);
        
        if (error) {
          console.error('Error fetching paginated documents:', error);
          throw new Error(`Failed to fetch documents: ${error.message}`);
        }
        
        return {
          documents: data as LodgeDocument[],
          total: count || 0,
          hasMore: offset + limit < (count || 0)
        };
      }, 10 * 60 * 1000) // 10 minute cache for paginated results
    );
  },

  getMeetingMinutes: async (): Promise<MeetingMinutes[]> => {
    return deduplicateRequest(CACHE_KEYS.MEETING_MINUTES, () =>
      dataCache.get(CACHE_KEYS.MEETING_MINUTES, async () => {
        const query = supabase
          .from('meeting_minutes')
          .select('*')
          .order('meeting_date', { ascending: false });
        
        const { data, error } = await withTimeout(query, 45000);
        
        if (error) {
          console.error('Error fetching meeting minutes:', error);
          throw new Error(`Failed to fetch meeting minutes: ${error.message}`);
        }
        
        return data as MeetingMinutes[];
      }, 20 * 60 * 1000) // 20 minute cache
    );
  },
  
  // Create new meeting minutes
  createMinutes: async (minutes: Omit<MeetingMinutes, 'id' | 'created_at' | 'updated_at'>): Promise<MeetingMinutes> => {
    const query = supabase
      .from('meeting_minutes')
      .insert(minutes)
      .select()
      .single();
    
    const { data, error } = await withTimeout(query, 45000);
    
    if (error) {
      console.error('Error creating meeting minutes:', error);
      throw new Error(`Failed to create meeting minutes: ${error.message}`);
    }
    
    // Invalidate cache
    optimizedApi.invalidateCache.meetingMinutes();
    
    return data as MeetingMinutes;
  },

  // Update existing meeting minutes
  updateMinutes: async (id: string, minutes: Partial<MeetingMinutes>): Promise<MeetingMinutes> => {
    try {
      const query = supabase
        .from('meeting_minutes')
        .update(minutes)
        .eq('id', id)
        .select()
        .single();
      
      const { data, error } = await withTimeout(query, 45000);
      
      if (error) {
        console.error('Error updating meeting minutes:', error);
        throw new Error(`Failed to update meeting minutes: ${error.message}`);
      }
      
      // Invalidate cache
      optimizedApi.invalidateCache.meetingMinutes();
      
      return data as MeetingMinutes;
    } catch (error) {
      console.error('API Error - updateMinutes:', error);
      throw error;
    }
  },

  // Delete meeting minutes
  deleteMinutes: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('meeting_minutes')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting meeting minutes:', error);
        throw new Error(`Failed to delete meeting minutes: ${error.message}`);
      }
      
      // Invalidate cache
      optimizedApi.invalidateCache.meetingMinutes();
    } catch (error) {
      console.error('API Error - deleteMinutes:', error);
      throw error;
    }
  },

  // Events
  getEvents: async (): Promise<CMSEvent[]> => {
    return deduplicateRequest(CACHE_KEYS.EVENTS, () =>
      dataCache.get(CACHE_KEYS.EVENTS, async () => {
        const query = supabase
          .from('events')
          .select('id, title, description, event_date, location, is_members_only, is_past_event')
          .order('event_date', { ascending: true });
        
        const { data, error } = await withTimeout(query);
        
        if (error) {
          console.error('Error fetching events:', error);
          throw new Error(`Failed to fetch events: ${error.message}`);
        }
        
        return data as CMSEvent[];
      }, 10 * 60 * 1000) // 10 minute cache for events
    );
  },

  getNextUpcomingEvent: async (): Promise<CMSEvent | null> => {
    return deduplicateRequest('next_upcoming_event', () =>
      dataCache.get('next_upcoming_event', async () => {
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
      }, 5 * 60 * 1000) // 5 minute cache for next upcoming event
    );
  },

  // News Articles
  getNewsArticles: async (): Promise<CMSNewsArticle[]> => {
    return deduplicateRequest(CACHE_KEYS.NEWS_ARTICLES, () =>
      dataCache.get(CACHE_KEYS.NEWS_ARTICLES, async () => {
        const query = supabase
          .from('blog_posts')
          .select('id, title, summary, content, image_url, publish_date, is_members_only, is_published, created_at')
          .order('publish_date', { ascending: false });
        
        const { data, error } = await withTimeout(query);
        
        if (error) {
          console.error('Error fetching news articles:', error);
          throw new Error(`Failed to fetch news articles: ${error.message}`);
        }
        
        return data as CMSNewsArticle[];
      }, 15 * 60 * 1000) // 15 minute cache for news articles
    );
  },

  // Officers
  getOfficers: async (): Promise<CMSOfficer[]> => {
    return deduplicateRequest(CACHE_KEYS.OFFICERS, () =>
      dataCache.get(CACHE_KEYS.OFFICERS, async () => {
        const query = supabase
          .from('officers')
          .select('id, position, full_name, image_url, sort_order, is_active')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        const { data, error } = await withTimeout(query);
        
        if (error) {
          console.error('Error fetching officers:', error);
          throw new Error(`Failed to fetch officers: ${error.message}`);
        }
        
        return data as CMSOfficer[];
      }, 20 * 60 * 1000) // 20 minute cache for officers
    );
  },

  // Testimonials
  getTestimonials: async (): Promise<CMSTestimonial[]> => {
    return deduplicateRequest(CACHE_KEYS.TESTIMONIALS, () =>
      dataCache.get(CACHE_KEYS.TESTIMONIALS, async () => {
        const query = supabase
          .from('testimonials')
          .select('id, member_name, content, image_url, is_published, sort_order')
          .eq('is_published', true)
          .order('sort_order', { ascending: true });
        
        const { data, error } = await withTimeout(query);
        
        if (error) {
          console.error('Error fetching testimonials:', error);
          throw new Error(`Failed to fetch testimonials: ${error.message}`);
        }
        
        return data as CMSTestimonial[];
      }, 20 * 60 * 1000) // 20 minute cache for testimonials
    );
  },

  // FAQ Items
  getFAQItems: async (): Promise<CMSFAQItem[]> => {
    return deduplicateRequest(CACHE_KEYS.FAQ_ITEMS, () =>
      dataCache.get(CACHE_KEYS.FAQ_ITEMS, async () => {
        const query = supabase
          .from('faq_items')
          .select('id, question, answer, sort_order, is_published')
          .eq('is_published', true)
          .order('sort_order', { ascending: true });
        
        const { data, error } = await withTimeout(query);
        
        if (error) {
          console.error('Error fetching FAQ items:', error);
          throw new Error(`Failed to fetch FAQ items: ${error.message}`);
        }
        
        return data as CMSFAQItem[];
      }, 20 * 60 * 1000) // 20 minute cache for FAQ items
    );
  },

  // Site Settings
  getSiteSettings: async (): Promise<CMSSiteSetting[]> => {
    return deduplicateRequest(CACHE_KEYS.SITE_SETTINGS, () =>
      dataCache.get(CACHE_KEYS.SITE_SETTINGS, async () => {
        const query = supabase
          .from('site_settings')
          .select('id, setting_key, setting_value, setting_type, description, updated_at')
          .order('setting_key', { ascending: true });
        
        const { data, error } = await withTimeout(query);
        
        if (error) {
          console.error('Error fetching site settings:', error);
          throw new Error(`Failed to fetch site settings: ${error.message}`);
        }
        
        return data as CMSSiteSetting[];
      }, 60 * 60 * 1000) // 1 hour cache for site settings
    );
  },

  // Page Content
  getPageContent: async (pageName?: string): Promise<CMSPageContent[]> => {
    try {
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
      
      return data as CMSPageContent[];
    } catch (error) {
      console.error('Optimized API Error - getPageContent:', error);
      throw error;
    }
  },

  // Cache invalidation methods
  invalidateCache: {
    memberProfile: (userId: string) => {
      dataCache.invalidate(`member_profile:${userId}`);
      dataCache.invalidate(CACHE_KEYS.MEMBERS);
    },
    
    documents: (category?: string) => {
      if (category) {
        dataCache.invalidate(CACHE_KEYS.DOCUMENTS_BY_CATEGORY(category));
      }
      dataCache.invalidate(CACHE_KEYS.DOCUMENTS);
      dataCache.invalidatePattern('documents_paginated:.*');
    },
    
    meetingMinutes: () => {
      dataCache.invalidate(CACHE_KEYS.MEETING_MINUTES);
    },
    
    events: () => {
      dataCache.invalidate(CACHE_KEYS.EVENTS);
    },
    
    news: () => {
      dataCache.invalidate(CACHE_KEYS.NEWS_ARTICLES);
    },
    
    officers: () => {
      dataCache.invalidate(CACHE_KEYS.OFFICERS);
    },
    
    testimonials: () => {
      dataCache.invalidate(CACHE_KEYS.TESTIMONIALS);
    },
    
    faq: () => {
      dataCache.invalidate(CACHE_KEYS.FAQ_ITEMS);
    },
    
    settings: () => {
      dataCache.invalidate(CACHE_KEYS.SITE_SETTINGS);
    },
    
    pageContent: (pageName?: string) => {
      if (pageName) {
        dataCache.invalidate(`page_content:${pageName}`);
      } else {
        dataCache.invalidatePattern('page_content:.*');
      }
    },
    
    all: () => {
      dataCache.clear();
    }
  },

  // Batch operations for better performance
  batchUpdateMembers: async (updates: Array<{ userId: string, data: Partial<MemberProfile> }>) => {
    const results = await Promise.allSettled(
      updates.map(({ userId, data }) => 
        supabase
          .from('member_profiles')
          .update(data)
          .eq('user_id', userId)
      )
    );
    
    // Invalidate relevant caches
    updates.forEach(({ userId }) => {
      optimizedApi.invalidateCache.memberProfile(userId);
    });
    
    return results;
  }
};

// Export both APIs for gradual migration
export { optimizedApi as api };