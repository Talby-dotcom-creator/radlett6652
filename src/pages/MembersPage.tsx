import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { optimizedApi as api } from '../lib/optimizedApi';
import { LodgeDocument, MeetingMinutes, MemberProfile } from '../types';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import VirtualizedList from '../components/VirtualizedList';
import PaginationControls from '../components/PaginationControls';
import DashboardCard from '../components/DashboardCard';
import ProfileSummaryCard from '../components/dashboard/ProfileSummaryCard';
import RecentUpdatesCard from '../components/dashboard/RecentUpdatesCard';
import RecentDocumentsCard from '../components/dashboard/RecentDocumentsCard';
import QuickActionsCard from '../components/dashboard/QuickActionsCard';
import { FileText, Clock, Users, AlertTriangle, BookOpen, ScrollText, Archive, LogOut, Search, Filter, X, ExternalLink } from 'lucide-react';

// Document categories with their display information
const DOCUMENT_CATEGORIES = [
  { key: 'news', label: 'Lodge News', icon: FileText },
  { key: 'blog', label: 'Blog Posts', icon: BookOpen },
  { key: 'snippet', label: 'Weekly Snippets', icon: ScrollText },
  { key: 'grand_lodge', label: 'Grand Lodge Communications', icon: FileText },
  { key: 'provincial', label: 'Provincial Communications', icon: FileText },
  { key: 'summons', label: 'Summons', icon: ScrollText },
  { key: 'minutes', label: 'Meeting Minutes', icon: Clock },
  { key: 'gpc_minutes', label: 'GPC Minutes', icon: Clock },
  { key: 'lodge_instruction', label: 'Lodge of Instruction', icon: BookOpen },
  { key: 'resources', label: 'Resources', icon: Archive },
  { key: 'solomon', label: 'Solomon', icon: BookOpen },
  { key: 'bylaws', label: 'Bylaws', icon: FileText },
  { key: 'forms', label: 'Forms', icon: FileText },
  { key: 'ritual', label: 'Ritual', icon: BookOpen },
  { key: 'other', label: 'Other', icon: FileText }
];

const MembersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, profile: userProfile, loading: authLoading, needsPasswordReset } = useAuth();
  
  // Basic state
  const [allDocuments, setAllDocuments] = useState<LodgeDocument[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinutes[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [pageContent, setPageContent] = useState<Record<string, string>>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Document filtering state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Simple pagination state (no external hook)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Handle navigation for non-authenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Redirect pending users to pending page
    if (!authLoading && user && userProfile && userProfile.status === 'pending') {
      navigate('/members/pending', { replace: true });
      return;
    }
    
    // Redirect inactive users to pending page as well
    if (!authLoading && user && userProfile && userProfile.status === 'inactive') {
      navigate('/members/pending', { replace: true });
      return;
    }
    
    if (!authLoading && user && needsPasswordReset) {
      navigate('/password-reset', { replace: true });
      return;
    }
  }, [authLoading, user, userProfile, needsPasswordReset, navigate]);

  // Load initial data - only once when user is available
  useEffect(() => {
    if (!user || authLoading || dataLoaded) {
      return;
    }

    const loadData = async () => {
      try {
        setDataLoading(true);
        
        console.log('🚀 MembersPage: Starting data load...');
        const startTime = Date.now();

        // Load page content (optional)
        try {
          console.log('📄 MembersPage: Loading page content...');
          const content = await api.getPageContent('members');
          const contentMap: Record<string, string> = {};
          content.forEach(item => {
            contentMap[item.section_name] = item.content;
          });
          setPageContent(contentMap);
          console.log('✅ MembersPage: Page content loaded');
        } catch (contentError) {
          console.warn('Could not load page content:', contentError);
        }
        
        console.log('📊 MembersPage: Loading documents and minutes...');
        const dataStartTime = Date.now();
        
        // Load only essential data initially - use smaller limits for faster loading
        const [documentsData, minutesData] = await Promise.all([
          api.getLodgeDocumentsPaginated(1, 50), // Load first 50 documents only
          api.getMeetingMinutes()
        ]);
        
        const dataLoadTime = Date.now() - dataStartTime;
        console.log(`📊 MembersPage: Data loaded in ${dataLoadTime}ms`);

        setAllDocuments(documentsData.documents || []);
        setMinutes(minutesData);
        
        console.log('📊 MembersPage: Documents loaded:', documentsData.documents?.length || 0);
        console.log('📊 MembersPage: Minutes loaded:', minutesData.length);
        
        const totalTime = Date.now() - startTime;
        console.log(`🎉 MembersPage: Total load time: ${totalTime}ms`);
        
      } catch (err) {
        console.error('Error loading member data:', err);
        // Let the error propagate to the user interface
        throw err;
      } finally {
        setDataLoading(false);
        setDataLoaded(true);
      }
    };

    loadData();
    
  }, [user, authLoading, dataLoaded]);

  // Calculate filtered and paginated documents
  const filteredAndPaginatedDocuments = useMemo(() => {
    if (selectedCategories.length === 0) {
      return { documents: [], total: 0, totalPages: 0 };
    }

    let allSelectedDocuments: (LodgeDocument | MeetingMinutes)[] = [];
    
    // Collect documents from selected categories
    selectedCategories.forEach(category => {
      if (category === 'minutes') {
        allSelectedDocuments.push(...minutes);
      } else {
        const categoryDocs = allDocuments.filter(doc => doc.category === category);
        allSelectedDocuments.push(...categoryDocs);
      }
    });
    
    // Apply search filter
    if (searchTerm.trim()) {
      allSelectedDocuments = allSelectedDocuments.filter(doc => {
        const title = doc.title.toLowerCase();
        const description = ('description' in doc ? doc.description : doc.content)?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return title.includes(search) || description.includes(search);
      });
    }
    
    // Sort by date (newest first)
    allSelectedDocuments.sort((a, b) => {
      const dateA = new Date('meeting_date' in a ? a.meeting_date : a.created_at);
      const dateB = new Date('meeting_date' in b ? b.meeting_date : b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Calculate pagination
    const total = allSelectedDocuments.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const documents = allSelectedDocuments.slice(start, end);
    
    return { documents, total, totalPages };
  }, [selectedCategories, allDocuments, minutes, searchTerm, currentPage, pageSize]);

  // Reset to first page when categories or search changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [selectedCategories, searchTerm]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryKey)) {
        return prev.filter(cat => cat !== categoryKey);
      } else {
        return [...prev, categoryKey];
      }
    });
  };

  const handleClearAllCategories = () => {
    setSelectedCategories([]);
    setSearchTerm('');
  };

  // Get document counts by category
  const getCategoryCount = (categoryKey: string) => {
    if (categoryKey === 'minutes') {
      return minutes.length;
    }
    return allDocuments.filter(doc => doc.category === categoryKey).length;
  };

  // Simple pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Document row renderer for virtualized list
  const DocumentRow = ({ index, style, data }: { index: number; style: React.CSSProperties; data: (LodgeDocument | MeetingMinutes)[] }) => {
    const doc = data[index];
    const isMinute = 'meeting_date' in doc;
    
    return (
      <div style={style} className="px-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4 flex items-center justify-between hover:shadow-soft transition-shadow">
          <div className="flex-grow">
            <h3 className="font-medium text-primary-600">{doc.title}</h3>
            {isMinute ? (
              <>
                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{doc.content.substring(0, 150)}...</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded">
                    MEETING MINUTES
                  </span>
                  <span className="text-xs text-neutral-500 ml-4">
                    Meeting: {new Date(doc.meeting_date).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </>
            ) : (
              <>
                {doc.description && (
                  <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{doc.description}</p>
                )}
                <div className="flex items-center mt-2">
                  <span className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                    {doc.category.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-neutral-500 ml-4">
                    Added {new Date(doc.created_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <a
              href={isMinute ? (doc as any).document_url || '#' : doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-neutral-500 hover:text-primary-600 transition-colors"
              title={isMinute ? "View meeting minutes" : "Open document"}
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </div>
    );
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

  // Show loading while data is loading
  if (user && dataLoading) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 text-center pt-12">
          <LoadingSpinner subtle={true} />
        </div>
      </div>
    );
  }

  // Don't render anything if redirecting
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20 bg-neutral-50">
      <div className="container mx-auto px-4 md:px-6">
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Document Category Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-soft p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-heading font-semibold text-primary-600">
                    Document Categories
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Select categories to view
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex items-center"
                >
                  <LogOut size={16} className="mr-2" />
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </Button>
              </div>

              {/* Category Selection */}
              <div className="space-y-3">
                {DOCUMENT_CATEGORIES.map((category) => {
                  const count = getCategoryCount(category.key);
                  const IconComponent = category.icon;
                  
                  return (
                    <label
                      key={category.key}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedCategories.includes(category.key)
                          ? 'border-secondary-500 bg-secondary-50'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.key)}
                        onChange={() => handleCategoryToggle(category.key)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                        selectedCategories.includes(category.key)
                          ? 'border-secondary-500 bg-secondary-500'
                          : 'border-neutral-300'
                      }`}>
                        {selectedCategories.includes(category.key) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <IconComponent size={16} className="text-neutral-500 mr-2" />
                      <div className="flex-grow">
                        <span className="text-sm font-medium text-neutral-700">
                          {category.label}
                        </span>
                        <span className="text-xs text-neutral-500 ml-2">
                          ({count})
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Clear All Button */}
              {selectedCategories.length > 0 && (
                <div className="mt-6 pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllCategories}
                    className="w-full flex items-center justify-center"
                  >
                    <X size={16} className="mr-2" />
                    Clear All Selections
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Dashboard Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Profile Summary Card */}
              <ProfileSummaryCard 
                profile={userProfile} 
                userEmail={user?.email}
              />
              
              {/* Recent Updates Card */}
              <RecentUpdatesCard 
                minutes={minutes}
                onViewAllMinutes={() => setSelectedCategories(['minutes'])}
              />
              
              {/* Recent Documents Card */}
              <RecentDocumentsCard 
                documents={allDocuments}
                onViewAllDocuments={() => setSelectedCategories(['grand_lodge', 'provincial', 'summons', 'resources'])}
              />
              
              {/* Quick Actions Card - spans full width on mobile, single column on larger screens */}
              <div className="md:col-span-2 lg:col-span-3">
                <QuickActionsCard 
                  isAdmin={isAdmin || userProfile?.role === 'admin'}
                  onSelectMinutes={() => setSelectedCategories(['minutes'])}
                />
              </div>
            </div>

            {/* Document Browser Section */}
            <DashboardCard 
              title="Document Browser"
              icon={FileText}
              headerAction={
                selectedCategories.length > 0 && (
                  <span className="text-sm text-neutral-500">
                    {filteredAndPaginatedDocuments.total} documents found
                  </span>
                )
              }
            >
              {selectedCategories.length === 0 && (
                <p className="text-sm text-neutral-500 mb-6">
                  Select categories from the left to view documents
                </p>
              )}

              {/* Search Bar - Only show when categories are selected */}
              {selectedCategories.length > 0 && (
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search within selected documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                  </div>
                </div>
              )}

              {/* Document Display Area */}
              {selectedCategories.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-12 h-12 text-neutral-300" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-600 mb-2">
                    Select Document Categories
                  </h3>
                  <p className="text-neutral-500 max-w-md mx-auto">
                    Choose one or more categories from the left sidebar to view documents. 
                    You can select multiple categories to see a combined view.
                  </p>
                </div>
              ) : filteredAndPaginatedDocuments.documents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-12 h-12 text-neutral-300" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-600 mb-2">
                    No Documents Found
                  </h3>
                  <p className="text-neutral-500 max-w-md mx-auto">
                    {searchTerm 
                      ? `No documents match your search "${searchTerm}" in the selected categories.`
                      : 'No documents found for your current selection. Try selecting different categories.'
                    }
                  </p>
                  {searchTerm && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="mt-4"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Virtualized list for better performance */}
                  <VirtualizedList
                    items={filteredAndPaginatedDocuments.documents}
                    height={600}
                    itemHeight={120}
                    renderItem={DocumentRow}
                    className="border border-neutral-200 rounded-lg"
                  />
                  
                  {/* Pagination controls */}
                  {filteredAndPaginatedDocuments.total > pageSize && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={filteredAndPaginatedDocuments.totalPages}
                      pageSize={pageSize}
                      totalItems={filteredAndPaginatedDocuments.total}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      canGoNext={currentPage < filteredAndPaginatedDocuments.totalPages}
                      canGoPrev={currentPage > 1}
                      onFirstPage={() => setCurrentPage(1)}
                      onLastPage={() => setCurrentPage(filteredAndPaginatedDocuments.totalPages)}
                      onNextPage={() => setCurrentPage(prev => Math.min(prev + 1, filteredAndPaginatedDocuments.totalPages))}
                      onPrevPage={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    />
                  )}
                </div>
              )}
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersPage;