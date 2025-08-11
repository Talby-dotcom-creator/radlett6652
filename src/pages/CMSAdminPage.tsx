import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cmsApi } from '../lib/cmsApi';
import { supabase } from '../lib/supabase';
import { 
  CMSEvent, 
  CMSNewsArticle, 
  CMSOfficer, 
  CMSTestimonial, 
  CMSFAQItem, 
  CMSSiteSetting, 
  CMSPageContent 
} from '../types';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  FileText, 
  Users, 
  MessageSquare, 
  HelpCircle, 
  Settings, 
  Globe,
  LogOut,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

// Import forms
import EventForm from '../components/cms/EventForm';
import NewsForm from '../components/cms/NewsForm';
import OfficerForm from '../components/cms/OfficerForm';
import TestimonialForm from '../components/cms/TestimonialForm';
import FAQForm from '../components/cms/FAQForm';
import SiteSettingsForm from '../components/cms/SiteSettingsForm';
import PageContentForm from '../components/cms/PageContentForm';
import PageContentManager from '../components/cms/PageContentManager';

type TabType = 'events' | 'news' | 'officers' | 'testimonials' | 'faq' | 'settings' | 'pages';

const CMSAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [events, setEvents] = useState<CMSEvent[]>([]);
  const [news, setNews] = useState<CMSNewsArticle[]>([]);
  const [officers, setOfficers] = useState<CMSOfficer[]>([]);
  const [testimonials, setTestimonials] = useState<CMSTestimonial[]>([]);
  const [faqItems, setFaqItems] = useState<CMSFAQItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<CMSSiteSetting[]>([]);
  const [pageContent, setPageContent] = useState<CMSPageContent[]>([]);

  // Content counts
  const [contentCounts, setContentCounts] = useState<Record<string, number>>({
    events: 0,
    news: 0,
    officers: 0,
    testimonials: 0,
    faq: 0,
    settings: 0,
    pages: 0
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Check authentication and admin status
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/members', { replace: true });
    }
  }, [authLoading, user, isAdmin, navigate]);

  // Load all content counts
  const loadAllCounts = async () => {
    try {
      const counts = await cmsApi.getContentCounts();
      setContentCounts(counts);
    } catch (err) {
      console.error('Error loading content counts:', err);
    }
  };

  // Load data for specific tab
  const loadDataForTab = async (tab: TabType) => {
    try {
      setLoading(true);
      setError(null);

      switch (tab) {
        case 'events':
          const eventsData = await cmsApi.getEvents();
          setEvents(eventsData);
          break;

        case 'news':
          const newsData = await cmsApi.getNewsArticles();
          setNews(newsData);
          break;

        case 'officers':
          const officersData = await cmsApi.getOfficers();
          setOfficers(officersData);
          break;

        case 'testimonials':
          const testimonialsData = await cmsApi.getTestimonials();
          setTestimonials(testimonialsData);
          break;

        case 'faq':
          const faqData = await cmsApi.getFAQItems();
          setFaqItems(faqData);
          break;

        case 'settings':
          const settingsData = await cmsApi.getSiteSettings();
          setSiteSettings(settingsData);
          break;

        case 'pages':
          const pagesData = await cmsApi.getPageContent();
          setPageContent(pagesData);
          break;
      }
    } catch (err) {
      console.error(`Error loading data for ${tab} tab:`, err);
      const errorMessage = err instanceof Error ? err.message : `Failed to load ${tab} data`;
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Test connection and load initial data
  useEffect(() => {
    if (!user || !isAdmin || authLoading) {
      return;
    }

    const initializeData = async () => {
      try {
        setConnectionStatus('checking');
        
        // Test basic connection
        const { data, error } = await supabase.from('events').select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error('Connection test failed:', error);
          setConnectionStatus('failed');
          setError(`Connection failed: ${error.message}`);
        } else {
          setConnectionStatus('connected');
          await loadAllCounts();
          await loadDataForTab(activeTab);
        }
      } catch (err) {
        console.error('Connection error:', err);
        setConnectionStatus('failed');
        setError('Failed to connect to database');
      }
    };

    initializeData();
  }, [user, isAdmin, authLoading, activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setShowForm(false);
    setEditingItem(null);
    if (connectionStatus === 'connected') {
      loadDataForTab(tab);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
      showError('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleRefreshData = () => {
    loadDataForTab(activeTab);
  };

  // Event handlers
  const handleEventSubmit = async (data: Omit<CMSEvent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingItem) {
        await cmsApi.updateEvent(editingItem.id, data);
        success('Event updated successfully');
      } else {
        await cmsApi.createEvent(data);
        success('Event created successfully');
      }
      setShowForm(false);
      setEditingItem(null);
      await loadDataForTab('events');
    } catch (err) {
      showError(editingItem ? 'Failed to update event' : 'Failed to create event');
    }
  };

  const handleNewsSubmit = async (data: Omit<CMSNewsArticle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingItem) {
        await cmsApi.updateNewsArticle(editingItem.id, data);
        success('News article updated successfully');
      } else {
        await cmsApi.createNewsArticle(data);
        success('News article created successfully');
      }
      setShowForm(false);
      setEditingItem(null);
      await loadDataForTab('news');
    } catch (err) {
      showError(editingItem ? 'Failed to update news article' : 'Failed to create news article');
    }
  };

  const handleOfficerSubmit = async (data: Omit<CMSOfficer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingItem) {
        await cmsApi.updateOfficer(editingItem.id, data);
        success('Officer updated successfully');
      } else {
        await cmsApi.createOfficer(data);
        success('Officer created successfully');
      }
      setShowForm(false);
      setEditingItem(null);
      await loadDataForTab('officers');
    } catch (err) {
      showError(editingItem ? 'Failed to update officer' : 'Failed to create officer');
    }
  };

  const handleTestimonialSubmit = async (data: Omit<CMSTestimonial, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingItem) {
        await cmsApi.updateTestimonial(editingItem.id, data);
        success('Testimonial updated successfully');
      } else {
        await cmsApi.createTestimonial(data);
        success('Testimonial created successfully');
      }
      setShowForm(false);
      setEditingItem(null);
      await loadDataForTab('testimonials');
    } catch (err) {
      showError(editingItem ? 'Failed to update testimonial' : 'Failed to create testimonial');
    }
  };

  const handleFAQSubmit = async (data: Omit<CMSFAQItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingItem) {
        await cmsApi.updateFAQItem(editingItem.id, data);
        success('FAQ updated successfully');
      } else {
        await cmsApi.createFAQItem(data);
        success('FAQ created successfully');
      }
      setShowForm(false);
      setEditingItem(null);
      await loadDataForTab('faq');
    } catch (err) {
      showError(editingItem ? 'Failed to update FAQ' : 'Failed to create FAQ');
    }
  };

  const handleSettingsSubmit = async (data: Record<string, string>) => {
    try {
      // Update each setting individually
      const updatePromises = Object.entries(data).map(([key, value]) =>
        cmsApi.updateSiteSetting(key, value)
      );
      
      await Promise.all(updatePromises);
      success('Settings updated successfully');
      setShowForm(false);
      setEditingItem(null);
      await loadDataForTab('settings');
    } catch (err) {
      showError('Failed to update settings');
    }
  };

  const handlePageContentSubmit = async (data: Omit<CMSPageContent, 'id' | 'updated_at'>) => {
    try {
      if (editingItem) {
        await cmsApi.updatePageContent(data.page_name, data.section_name, data.content);
        success('Page content updated successfully');
      } else {
        await cmsApi.createPageContent(data);
        success('Page content created successfully');
      }
      setShowForm(false);
      setEditingItem(null);
      await loadDataForTab('pages');
    } catch (err) {
      showError(editingItem ? 'Failed to update page content' : 'Failed to create page content');
    }
  };

  const handleDelete = async (id: string, type: string) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${type}`,
      message: `Are you sure you want to delete this ${type}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          switch (activeTab) {
            case 'events':
              await cmsApi.deleteEvent(id);
              break;
            case 'news':
              await cmsApi.deleteNewsArticle(id);
              break;
            case 'officers':
              await cmsApi.deleteOfficer(id);
              break;
            case 'testimonials':
              await cmsApi.deleteTestimonial(id);
              break;
            case 'faq':
              await cmsApi.deleteFAQItem(id);
              break;
          }
          success(`${type} deleted successfully`);
          await loadDataForTab(activeTab);
        } catch (err) {
          showError(`Failed to delete ${type}`);
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 text-center pt-12">
          <LoadingSpinner subtle={true} />
        </div>
      </div>
    );
  }

  // Don't render anything if redirecting
  if (!user || !isAdmin) {
    return null;
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'events': return events;
      case 'news': return news;
      case 'officers': return officers;
      case 'testimonials': return testimonials;
      case 'faq': return faqItems;
      case 'settings': return siteSettings;
      case 'pages': return pageContent;
      default: return [];
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="min-h-screen pb-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary-600 mb-2">
              Content Management System
            </h1>
            <p className="text-neutral-600">
              Manage website content, events, news, and settings
            </p>
            
            {/* Connection Status Indicator */}
            <div className="flex items-center mt-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'failed' ? 'bg-red-500' : 
                'bg-yellow-500'
              }`} />
              <span className={`text-xs ${
                connectionStatus === 'connected' ? 'text-green-600' : 
                connectionStatus === 'failed' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {connectionStatus === 'connected' ? 'Connected to Supabase' : 
                 connectionStatus === 'failed' ? 'Connection Failed' : 
                 'Checking Connection...'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={handleRefreshData}
              disabled={loading}
              className="flex items-center"
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center"
            >
              <LogOut size={16} className="mr-2" />
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-8 flex items-start">
            <AlertTriangle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Error:</strong> {error}
              <button 
                onClick={() => setError(null)}
                className="ml-4 text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={activeTab === 'events' ? 'primary' : 'outline'}
            onClick={() => handleTabChange('events')}
            className="flex items-center"
          >
            <Calendar size={18} className="mr-2" />
            Events ({contentCounts.events})
          </Button>
          <Button
            variant={activeTab === 'news' ? 'primary' : 'outline'}
            onClick={() => handleTabChange('news')}
            className="flex items-center"
          >
            <FileText size={18} className="mr-2" />
            News ({contentCounts.news})
          </Button>
          <Button
            variant={activeTab === 'officers' ? 'primary' : 'outline'}
            onClick={() => handleTabChange('officers')}
            className="flex items-center"
          >
            <Users size={18} className="mr-2" />
            Officers ({contentCounts.officers})
          </Button>
          <Button
            variant={activeTab === 'testimonials' ? 'primary' : 'outline'}
            onClick={() => handleTabChange('testimonials')}
            className="flex items-center"
          >
            <MessageSquare size={18} className="mr-2" />
            Testimonials ({contentCounts.testimonials})
          </Button>
          <Button
            variant={activeTab === 'faq' ? 'primary' : 'outline'}
            onClick={() => handleTabChange('faq')}
            className="flex items-center"
          >
            <HelpCircle size={18} className="mr-2" />
            FAQ ({contentCounts.faq})
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'primary' : 'outline'}
            onClick={() => handleTabChange('settings')}
            className="flex items-center"
          >
            <Settings size={18} className="mr-2" />
            Settings ({contentCounts.settings})
          </Button>
          <Button
            variant={activeTab === 'pages' ? 'primary' : 'outline'}
            onClick={() => handleTabChange('pages')}
            className="flex items-center"
          >
            <Globe size={18} className="mr-2" />
            Pages ({contentCounts.pages})
          </Button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-soft p-6">
          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner subtle={true} />
              <p className="text-neutral-500 mt-2">Loading {activeTab}...</p>
            </div>
          ) : connectionStatus === 'failed' ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">Connection Failed</h3>
              <p className="text-neutral-600 mb-4">
                Unable to connect to the database. Please try refreshing the page.
              </p>
              <Button onClick={handleRefreshData} className="flex items-center mx-auto">
                <RefreshCw size={16} className="mr-2" />
                Retry Connection
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-semibold text-primary-600">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
                </h2>
                {activeTab !== 'settings' && (
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="flex items-center"
                  >
                    <Plus size={16} className="mr-2" />
                    Add {activeTab.slice(0, -1)}
                  </Button>
                )}
              </div>

              {/* Form Display */}
              {showForm && (
                <div className="bg-neutral-50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-primary-600 mb-4">
                    {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
                  </h3>
                  
                  {activeTab === 'events' && (
                    <EventForm
                      onSubmit={handleEventSubmit}
                      onCancel={() => {
                        setShowForm(false);
                        setEditingItem(null);
                      }}
                      initialData={editingItem}
                    />
                  )}
                  
                  {activeTab === 'news' && (
                    <NewsForm
                      onSubmit={handleNewsSubmit}
                      onCancel={() => {
                        setShowForm(false);
                        setEditingItem(null);
                      }}
                      initialData={editingItem}
                    />
                  )}

                  {activeTab === 'officers' && (
                    <OfficerForm
                      onSubmit={handleOfficerSubmit}
                      onCancel={() => {
                        setShowForm(false);
                        setEditingItem(null);
                      }}
                      initialData={editingItem}
                    />
                  )}

                  {activeTab === 'testimonials' && (
                    <TestimonialForm
                      onSubmit={handleTestimonialSubmit}
                      onCancel={() => {
                        setShowForm(false);
                        setEditingItem(null);
                      }}
                      initialData={editingItem}
                    />
                  )}

                  {activeTab === 'faq' && (
                    <FAQForm
                      onSubmit={handleFAQSubmit}
                      onCancel={() => {
                        setShowForm(false);
                        setEditingItem(null);
                      }}
                      initialData={editingItem}
                    />
                  )}

                  {activeTab === 'pages' && (
                    <PageContentForm
                      onSubmit={handlePageContentSubmit}
                      onCancel={() => {
                        setShowForm(false);
                        setEditingItem(null);
                      }}
                      initialData={editingItem}
                    />
                  )}
                </div>
              )}

              {/* Settings Management - Special Case */}
              {activeTab === 'settings' ? (
                <div>
                  {siteSettings.length > 0 ? (
                    <div className="bg-neutral-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-primary-600 mb-4">
                        Site Settings
                      </h3>
                      <SiteSettingsForm
                        initialData={siteSettings}
                        onSubmit={handleSettingsSubmit}
                        onCancel={() => {}}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Settings className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                      <h3 className="text-lg font-medium text-neutral-600 mb-2">
                        No settings found
                      </h3>
                      <p className="text-neutral-500">
                        Settings will be loaded automatically when available.
                      </p>
                    </div>
                  )}
                </div>
              ) : activeTab === 'pages' ? (
                <PageContentManager onContentUpdate={loadDataForTab.bind(null, 'pages')} />
              ) : (
                /* Regular Content Display */
                currentData && currentData.length > 0 ? (
                  <div className="space-y-4">
                    {currentData.map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-neutral-50 rounded-lg border border-neutral-200 p-4 flex items-center justify-between hover:shadow-soft transition-shadow"
                      >
                        <div className="flex-grow">
                          <h3 className="font-medium text-primary-600">
                            {item.title || item.full_name || item.member_name || item.question || item.setting_key || item.page_name}
                          </h3>
                          <p className="text-sm text-neutral-600 mt-1">
                            {item.description || item.summary || item.position || 
                             (item.content && item.content.substring(0, 100)) || 
                             item.setting_value || item.section_name}
                            {item.content && item.content.length > 100 && '...'}
                          </p>
                          <div className="flex items-center mt-2">
                            {item.is_published !== undefined && (
                              <span className={`text-xs font-medium px-2 py-1 rounded mr-2 ${
                                item.is_published 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {item.is_published ? 'Published' : 'Draft'}
                              </span>
                            )}
                            {item.is_active !== undefined && (
                              <span className={`text-xs font-medium px-2 py-1 rounded mr-2 ${
                                item.is_active 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </span>
                            )}
                            <span className="text-xs text-neutral-500">
                              {item.created_at && `Created ${new Date(item.created_at).toLocaleDateString()}`}
                              {item.updated_at && `Updated ${new Date(item.updated_at).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button 
                            className="p-2 text-neutral-500 hover:text-secondary-500 transition-colors"
                            onClick={() => {
                              setEditingItem(item);
                              setShowForm(true);
                            }}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          {activeTab !== 'settings' && (
                            <button 
                              className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                              onClick={() => handleDelete(item.id, activeTab.slice(0, -1))}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {activeTab === 'events' && <Calendar className="w-8 h-8 text-neutral-400" />}
                      {activeTab === 'news' && <FileText className="w-8 h-8 text-neutral-400" />}
                      {activeTab === 'officers' && <Users className="w-8 h-8 text-neutral-400" />}
                      {activeTab === 'testimonials' && <MessageSquare className="w-8 h-8 text-neutral-400" />}
                      {activeTab === 'faq' && <HelpCircle className="w-8 h-8 text-neutral-400" />}
                      {activeTab === 'settings' && <Settings className="w-8 h-8 text-neutral-400" />}
                      {activeTab === 'pages' && <Globe className="w-8 h-8 text-neutral-400" />}
                    </div>
                    <h3 className="text-lg font-medium text-neutral-600 mb-2">
                      No {activeTab} found
                    </h3>
                    <p className="text-neutral-500 mb-4">
                      Get started by creating your first {activeTab.slice(0, -1)}.
                    </p>
                    {activeTab !== 'settings' && (
                      <Button 
                        onClick={() => setShowForm(true)}
                        className="flex items-center mx-auto"
                      >
                        <Plus size={16} className="mr-2" />
                        Add {activeTab.slice(0, -1)}
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          type="danger"
          confirmText="Delete"
        />

        {/* Toast Notifications */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default CMSAdminPage;