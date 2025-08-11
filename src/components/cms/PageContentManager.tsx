import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Globe, Save, X, Eye, RefreshCw } from 'lucide-react';
import { optimizedApi } from '../../lib/optimizedApi';
import { dataCache, CACHE_KEYS } from '../../lib/dataCache';
import { CMSPageContent } from '../../types';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface PageContentManagerProps {
  onContentUpdate?: () => void;
}

// Predefined page sections that admins can manage
const PAGE_SECTIONS = {
  homepage: [
    { key: 'hero_title', label: 'Hero Title', type: 'text', description: 'Main title on homepage' },
    { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'text', description: 'Subtitle under main title' },
    { key: 'welcome_title', label: 'Welcome Section Title', type: 'text', description: 'Title for welcome section' },
    { key: 'welcome_text', label: 'Welcome Text', type: 'html', description: 'Main welcome content' },
    { key: 'values_intro', label: 'Values Introduction', type: 'text', description: 'Introduction text for values section' }
  ],
  about: [
    { key: 'history_title', label: 'History Section Title', type: 'text', description: 'Title for history section' },
    { key: 'history_intro', label: 'History Introduction', type: 'html', description: 'Introduction to lodge history' },
    { key: 'founding_story', label: 'Founding Story', type: 'html', description: 'Story of how the lodge was founded' },
    { key: 'modern_era', label: 'Modern Era', type: 'html', description: 'Current activities and focus' }
  ],
  join: [
    { key: 'intro_title', label: 'Introduction Title', type: 'text', description: 'Main title for becoming a freemason section' },
    { key: 'intro_subtitle', label: 'Introduction Subtitle', type: 'text', description: 'Subtitle for introduction' },
    { key: 'intro_paragraph_1', label: 'Introduction Paragraph 1', type: 'html', description: 'First paragraph about joining' },
    { key: 'intro_paragraph_2', label: 'Introduction Paragraph 2', type: 'html', description: 'Second paragraph about the process' },
    { key: 'requirements_intro', label: 'Requirements Introduction', type: 'text', description: 'Introduction to membership requirements' },
    { key: 'process_intro', label: 'Process Introduction', type: 'text', description: 'Introduction to membership process' },
    { key: 'financial_intro', label: 'Financial Information', type: 'html', description: 'Information about financial commitments' }
  ],
  contact: [
    { key: 'intro_text', label: 'Introduction Text', type: 'html', description: 'Main introduction on contact page' },
    { key: 'visiting_info', label: 'Visiting Information', type: 'html', description: 'Information for visiting Freemasons' },
    { key: 'meeting_times', label: 'Meeting Schedule', type: 'html', description: 'Lodge meeting schedule information' }
  ],
  events: [
    { key: 'intro_text', label: 'Introduction Text', type: 'html', description: 'Introduction text for events page' },
    { key: 'calendar_help', label: 'Calendar Help Text', type: 'text', description: 'Help text for using the calendar' }
  ],
  news: [
    { key: 'intro_text', label: 'Introduction Text', type: 'html', description: 'Introduction text for news page' },
    { key: 'search_help', label: 'Search Help Text', type: 'text', description: 'Help text for searching news' }
  ],
  faq: [
    { key: 'intro_text', label: 'Introduction Text', type: 'html', description: 'Introduction text for FAQ page' },
    { key: 'contact_cta', label: 'Contact Call-to-Action', type: 'text', description: 'Text encouraging users to contact for more questions' }
  ],
  privacy: [
    { key: 'intro', label: 'Introduction', type: 'html', description: 'Privacy policy introduction' },
    { key: 'info_collected', label: 'Information We Collect', type: 'html', description: 'What information is collected' },
    { key: 'info_usage', label: 'How We Use Information', type: 'html', description: 'How collected information is used' },
    { key: 'data_security', label: 'Data Security', type: 'html', description: 'Information about data security' },
    { key: 'your_rights', label: 'Your Rights', type: 'html', description: 'User rights regarding their data' }
  ],
  terms: [
    { key: 'intro', label: 'Introduction', type: 'html', description: 'Terms of use introduction' },
    { key: 'acceptance', label: 'Acceptance of Terms', type: 'html', description: 'Terms acceptance clause' },
    { key: 'use_license', label: 'Use License', type: 'html', description: 'License terms for using the site' },
    { key: 'disclaimer', label: 'Disclaimer', type: 'html', description: 'Site disclaimer' }
  ]
};

const PageContentManager: React.FC<PageContentManagerProps> = ({ onContentUpdate }) => {
  const [pageContent, setPageContent] = useState<CMSPageContent[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('homepage');
  const [editingContent, setEditingContent] = useState<CMSPageContent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    page_name: '',
    section_name: '',
    content_type: 'text' as 'text' | 'html',
    content: ''
  });

  useEffect(() => {
    loadPageContent();
  }, []);

  const loadPageContent = async () => {
    try {
      setLoading(true);
      const content = await dataCache.get(
        'page_content:all', 
        () => optimizedApi.getPageContent(), 
        15 * 60 * 1000 // 15 min cache for all page content
      );
      setPageContent(content);
    } catch (err) {
      console.error('Error loading page content:', err);
      showError('Failed to load page content');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultContent = async () => {
    try {
      setSaving(true);
      
      // Create comprehensive default content for all pages
      const defaultContent = [
        // Homepage
        { page_name: 'homepage', section_name: 'hero_title', content_type: 'text', content: 'Radlett Lodge No. 6652' },
        { page_name: 'homepage', section_name: 'hero_subtitle', content_type: 'text', content: 'Integrity, Friendship, Respect and Service' },
        { page_name: 'homepage', section_name: 'welcome_title', content_type: 'text', content: 'Welcome to Our Lodge' },
        { page_name: 'homepage', section_name: 'welcome_text', content_type: 'html', content: '<p>Founded in 1948, Radlett Lodge No. 6652 is a vibrant Masonic Lodge operating under the United Grand Lodge of England within the Province of Hertfordshire.</p><p>Our Lodge is committed to fostering personal development, ethical conduct, and charitable endeavors among our members while maintaining the rich traditions of Freemasonry.</p>' },
        { page_name: 'homepage', section_name: 'values_intro', content_type: 'text', content: 'Freemasonry is founded on the principles of Brotherly Love, Relief, and Truth.' },
        
        // About page
        { page_name: 'about', section_name: 'history_title', content_type: 'text', content: 'Our History' },
        { page_name: 'about', section_name: 'history_intro', content_type: 'html', content: '<p>A journey through time: Exploring the rich heritage of Radlett Lodge No. 6652 since 1948.</p>' },
        { page_name: 'about', section_name: 'founding_story', content_type: 'html', content: '<p>Radlett Lodge No. 6652 was founded by a diverse group of friends residing in Radlett in the aftermath of World War II. The founding members included a doctor, a local businessman, a farmer, and a Savile Row tailor, among others.</p><p>With Elstree Lodge as its sponsor, Radlett Lodge was consecrated on May 31, 1948, by Admiral Sir Lionel Halsey, the Right Worshipful Provincial Grand Master.</p>' },
        { page_name: 'about', section_name: 'modern_era', content_type: 'html', content: '<p>Today, Radlett Lodge continues to be a place where people from all walks of life come together to form a friendly and welcoming brotherhood. We maintain the belief that everyone, regardless of background, has something valuable to contribute.</p>' },
        
        // Join page - Complete content
        { page_name: 'join', section_name: 'intro_title', content_type: 'text', content: 'Becoming a Freemason' },
        { page_name: 'join', section_name: 'intro_subtitle', content_type: 'text', content: 'Freemasonry welcomes men of good character who believe in a Supreme Being and want to contribute to their communities.' },
        { page_name: 'join', section_name: 'intro_paragraph_1', content_type: 'html', content: '<p>Joining Radlett Lodge is the beginning of a lifelong journey of personal development, fellowship, and service. Our members come from all walks of life, backgrounds, and beliefs, united by shared values and a desire to make a positive impact on the world.</p>' },
        { page_name: 'join', section_name: 'intro_paragraph_2', content_type: 'html', content: '<p>The process of becoming a Freemason is thoughtful and deliberate. We take time to get to know potential members, and for them to get to know us, ensuring that Freemasonry is the right path for each individual.</p>' },
        { page_name: 'join', section_name: 'requirements_intro', content_type: 'text', content: 'To be eligible for membership in Radlett Lodge No. 6652, you must meet the following criteria:' },
        { page_name: 'join', section_name: 'process_intro', content_type: 'text', content: 'The journey to becoming a member of Radlett Lodge involves several steps:' },
        { page_name: 'join', section_name: 'financial_intro', content_type: 'html', content: '<p>Membership in Radlett Lodge, as with all Masonic Lodges, involves certain financial obligations. These typically include initiation fees, annual subscriptions, dining fees, and voluntary charitable donations.</p>' },
        { page_name: 'join', section_name: 'cta_title', content_type: 'text', content: 'Ready to Begin Your Masonic Journey?' },
        { page_name: 'join', section_name: 'cta_text', content_type: 'html', content: '<p>If you\'re interested in joining Radlett Lodge No. 6652 or have additional questions, we\'d love to hear from you. Our Secretary will be happy to provide more information and guide you through the first steps.</p>' },
        // Contact page - Complete content
        { page_name: 'contact', section_name: 'intro_text', content_type: 'html', content: '<p>We welcome your inquiries about Radlett Lodge and Freemasonry. Whether you\'re interested in joining or simply want to learn more, we\'re here to help.</p>' },
        { page_name: 'contact', section_name: 'visiting_info', content_type: 'html', content: '<p>If you\'re a Freemason planning to visit Radlett Lodge, please contact our Secretary beforehand. Proof of membership in a recognized Masonic Lodge will be required.</p>' },
        { page_name: 'contact', section_name: 'meeting_times', content_type: 'html', content: '<p>Lodge meetings are held on specific Saturdays throughout the year. Please contact us for the exact schedule and any special arrangements.</p>' },
        
        // Events page
        { page_name: 'events', section_name: 'intro_text', content_type: 'html', content: '<p>Stay up to date with all Lodge meetings and social events. Use the calendar and filters to find events that interest you.</p>' },
        { page_name: 'events', section_name: 'calendar_help', content_type: 'text', content: 'Click on dates with events to see details, or use the filters to show only public events.' },
        
        // News page
        { page_name: 'news', section_name: 'intro_text', content_type: 'html', content: '<p>Keeping you updated with the activities and achievements of our Lodge.</p>' },
        { page_name: 'news', section_name: 'search_help', content_type: 'text', content: 'Use the search box to find specific articles or topics.' },
        
        // FAQ page
        { page_name: 'faq', section_name: 'intro_text', content_type: 'html', content: '<p>We\'ve compiled answers to questions we frequently receive about Freemasonry and our Lodge.</p>' },
        { page_name: 'faq', section_name: 'contact_cta', content_type: 'text', content: 'Still have questions? We\'re here to help.' },
        
        // Privacy page
        { page_name: 'privacy', section_name: 'intro', content_type: 'html', content: '<p>This Privacy Policy explains how Radlett Lodge No. 6652 ("we," "our," or "us") collects, uses, and protects your personal information when you visit our website or interact with us.</p>' },
        { page_name: 'privacy', section_name: 'info_collected', content_type: 'html', content: '<p>We may collect the following personal information:</p><ul><li>Name, email address, and contact information when you submit inquiries through our contact form</li><li>Information provided when expressing interest in joining our Lodge</li><li>Usage data and cookies to improve your browsing experience</li></ul>' },
        { page_name: 'privacy', section_name: 'info_usage', content_type: 'html', content: '<p>We use your personal information to:</p><ul><li>Respond to your inquiries and provide information about our Lodge</li><li>Process membership applications</li><li>Send communications about Lodge events and activities</li><li>Improve our website and services</li><li>Comply with legal obligations</li></ul>' },
        { page_name: 'privacy', section_name: 'data_security', content_type: 'html', content: '<p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no Internet-based site can be 100% secure, and we cannot guarantee the absolute security of your information.</p>' },
        { page_name: 'privacy', section_name: 'your_rights', content_type: 'html', content: '<p>Depending on your location, you may have rights related to your personal information, including:</p><ul><li>Access to your personal information</li><li>Correction of inaccurate data</li><li>Deletion of your personal information</li><li>Objection to processing</li><li>Data portability</li></ul>' },
        { page_name: 'privacy', section_name: 'last_updated', content_type: 'text', content: 'January 2025' },
        
        // Terms page
        { page_name: 'terms', section_name: 'intro', content_type: 'html', content: '<p>These Terms of Use govern your use of the Radlett Lodge No. 6652 website ("we," "our," or "us"). By accessing or using our website, you agree to be bound by these terms.</p>' },
        { page_name: 'terms', section_name: 'acceptance', content_type: 'html', content: '<p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>' },
        { page_name: 'terms', section_name: 'use_license', content_type: 'html', content: '<p>Permission is granted to temporarily download one copy of the materials on Radlett Lodge No. 6652\'s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p><ul><li>modify or copy the materials</li><li>use the materials for any commercial purpose or for any public display</li><li>attempt to decompile or reverse engineer any software contained on the website</li><li>remove any copyright or other proprietary notations from the materials</li></ul>' },
        { page_name: 'terms', section_name: 'disclaimer', content_type: 'html', content: '<p>The materials on Radlett Lodge No. 6652\'s website are provided on an \'as is\' basis. Radlett Lodge No. 6652 makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>' },
        { page_name: 'terms', section_name: 'last_updated', content_type: 'text', content: 'January 2025' },
        
        // Members page
        { page_name: 'members', section_name: 'pending_title', content_type: 'text', content: 'Your Membership is Pending' },
        { page_name: 'members', section_name: 'pending_text', content_type: 'html', content: '<p>Thank you for registering. Your membership is currently pending verification by an administrator.</p><p>Once approved, you will have full access to all member resources. This typically takes 1-2 business days.</p><p>If you have any questions, please contact the Lodge Secretary.</p>' }
      ];

      // Insert all default content
      for (const content of defaultContent) {
        try {
          await optimizedApi.updatePageContent(content.page_name, content.section_name, content.content);
        } catch (err) {
          console.warn(`Failed to update ${content.page_name}.${content.section_name}:`, err);
          // Continue with other content even if one fails
        }
      }

      success('Default page content initialized successfully!');
      await loadPageContent();
      
    } catch (err) {
      console.error('Error initializing default content:', err);
      showError('Failed to initialize default content');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (content: CMSPageContent) => {
    setEditingContent(content);
    setFormData({
      page_name: content.page_name,
      section_name: content.section_name,
      content_type: content.content_type as 'text' | 'html',
      content: content.content
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await optimizedApi.updatePageContent(
        formData.page_name,
        formData.section_name,
        formData.content
      );
      
      success('Content updated successfully!');
      
      // Invalidate relevant caches
      dataCache.invalidate(CACHE_KEYS.PAGE_CONTENT(formData.page_name));
      dataCache.invalidate('page_content:all');
      
      await loadPageContent();
      setShowForm(false);
      setEditingContent(null);
      
      if (onContentUpdate) {
        onContentUpdate();
      }
      
    } catch (err) {
      console.error('Error saving content:', err);
      showError('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingContent(null);
    setFormData({ page_name: '', section_name: '', content_type: 'text', content: '' });
  };

  const handleCreateNew = () => {
    setEditingContent(null);
    setFormData({ 
      page_name: selectedPage, 
      section_name: '', 
      content_type: 'text', 
      content: '' 
    });
    setShowForm(true);
  };

  // Get content for selected page
  const selectedPageContent = pageContent.filter(content => content.page_name === selectedPage);
  
  // Get available sections for selected page
  const availableSections = PAGE_SECTIONS[selectedPage as keyof typeof PAGE_SECTIONS] || [];

  // Rich text editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header with Initialize Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-primary-600">Page Content Management</h3>
          <p className="text-sm text-neutral-600">Manage the text content that appears on your website pages</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={initializeDefaultContent}
            disabled={saving}
            className="flex items-center"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Adding Content...
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Add Default Content
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={loadPageContent}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner subtle={true} className="py-8" />
      ) : (
        <>
          {/* Page Selector */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(PAGE_SECTIONS).map((page) => (
              <Button
                key={page}
                variant={selectedPage === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedPage(page)}
                className="capitalize"
              >
                {page} Page
              </Button>
            ))}
          </div>

          {/* Content List for Selected Page */}
          <div className="bg-white rounded-lg border border-neutral-200">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-primary-600 capitalize">
                  {selectedPage} Page Content
                </h4>
                <Button
                  size="sm"
                  onClick={handleCreateNew}
                  className="flex items-center"
                >
                  <Plus size={14} className="mr-1" />
                  Add Section
                </Button>
              </div>
            </div>

            <div className="p-4">
              {selectedPageContent.length > 0 ? (
                <div className="space-y-3">
                  {selectedPageContent.map((content) => {
                    const sectionInfo = availableSections.find(s => s.key === content.section_name);
                    
                    return (
                      <div
                        key={content.id}
                        className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:shadow-soft transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium text-primary-600">
                                {sectionInfo?.label || content.section_name}
                              </h5>
                              <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-1 rounded">
                                {content.content_type}
                              </span>
                            </div>
                            
                            {sectionInfo?.description && (
                              <p className="text-xs text-neutral-500 mb-2">{sectionInfo.description}</p>
                            )}
                            
                            <div className="text-sm text-neutral-700">
                              {content.content_type === 'html' ? (
                                <div 
                                  className="prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: content.content.substring(0, 200) + (content.content.length > 200 ? '...' : '') }}
                                />
                              ) : (
                                <p className="line-clamp-2">
                                  {content.content.substring(0, 200)}
                                  {content.content.length > 200 && '...'}
                                </p>
                              )}
                            </div>
                            
                            <p className="text-xs text-neutral-500 mt-2">
                              Last updated: {new Date(content.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEdit(content)}
                              className="p-2 text-neutral-500 hover:text-secondary-500 transition-colors"
                              title="Edit content"
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p className="text-neutral-600">No content sections found for this page.</p>
                  <p className="text-sm text-neutral-500 mt-1">Add sections to start managing content.</p>
                </div>
              )}
            </div>
          </div>

          {/* Edit Form Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCancel} />
              <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-neutral-200">
                  <h3 className="text-lg font-semibold text-primary-600">
                    {editingContent ? 'Edit Content Section' : 'Add New Content Section'}
                  </h3>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-primary-600 mb-2">
                          Page
                        </label>
                        <select
                          value={formData.page_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, page_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                          disabled={!!editingContent}
                        >
                          <option value="">Select a page</option>
                          {Object.keys(PAGE_SECTIONS).map(page => (
                            <option key={page} value={page} className="capitalize">
                              {page} Page
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-primary-600 mb-2">
                          Section
                        </label>
                        {formData.page_name && availableSections.length > 0 ? (
                          <select
                            value={formData.section_name}
                            onChange={(e) => {
                              const selectedSection = availableSections.find(s => s.key === e.target.value);
                              setFormData(prev => ({ 
                                ...prev, 
                                section_name: e.target.value,
                                content_type: selectedSection?.type as 'text' | 'html' || 'text'
                              }));
                            }}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                            disabled={!!editingContent}
                          >
                            <option value="">Select a section</option>
                            {availableSections.map(section => (
                              <option key={section.key} value={section.key}>
                                {section.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formData.section_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, section_name: e.target.value }))}
                            placeholder="Enter section name"
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                            disabled={!!editingContent}
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary-600 mb-2">
                        Content Type
                      </label>
                      <select
                        value={formData.content_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, content_type: e.target.value as 'text' | 'html' }))}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                      >
                        <option value="text">Plain Text</option>
                        <option value="html">Rich Text (HTML)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-primary-600 mb-2">
                        Content
                      </label>
                      {formData.content_type === 'html' ? (
                        <div className="border border-neutral-300 rounded-md overflow-hidden">
                          <ReactQuill
                            theme="snow"
                            value={formData.content}
                            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                            modules={quillModules}
                            placeholder="Enter your content here..."
                          />
                        </div>
                      ) : (
                        <textarea
                          value={formData.content}
                          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                          rows={6}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                          placeholder="Enter your content here..."
                        />
                      )}
                    </div>

                    {/* Preview */}
                    {formData.content && (
                      <div>
                        <label className="block text-sm font-medium text-primary-600 mb-2">
                          Preview
                        </label>
                        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md">
                          {formData.content_type === 'html' ? (
                            <div 
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: formData.content }}
                            />
                          ) : (
                            <p className="text-neutral-700">{formData.content}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6 border-t border-neutral-200 flex justify-end space-x-4">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={saving || !formData.content.trim() || !formData.page_name || !formData.section_name}
                    className="flex items-center"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Content
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PageContentManager;