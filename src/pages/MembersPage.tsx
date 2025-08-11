import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { optimizedApi as api } from '../lib/optimizedApi';
import { LodgeDocument, MeetingMinutes } from '../types';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FileText, 
  Clock, 
  Users, 
  AlertTriangle, 
  BookOpen, 
  ScrollText, 
  Archive, 
  Search, 
  ExternalLink,
  Calendar,
  User,
  Shield,
  Award,
  Settings,
  Edit,
  ChevronRight,
  Building2,
  Landmark,
  RefreshCw,
  Grid,
  List,
  ZoomIn,
  ZoomOut,
  Type,
  Eye
} from 'lucide-react';

// Document categories with their display information
const DOCUMENT_CATEGORIES = [
  { key: 'grand_lodge', label: 'Grand Lodge', icon: Landmark, color: 'bg-purple-100 border-purple-300 text-purple-800', description: 'Communications from Grand Lodge' },
  { key: 'provincial', label: 'Provincial', icon: Building2, color: 'bg-blue-100 border-blue-300 text-blue-800', description: 'Hertfordshire Provincial communications' },
  { key: 'summons', label: 'Summons', icon: ScrollText, color: 'bg-amber-100 border-amber-300 text-amber-800', description: 'Lodge meeting summons' },
  { key: 'minutes', label: 'Meeting Minutes', icon: Clock, color: 'bg-green-100 border-green-300 text-green-800', description: 'Records of Lodge meetings' },
  { key: 'gpc_minutes', label: 'GPC Minutes', icon: Clock, color: 'bg-teal-100 border-teal-300 text-teal-800', description: 'Group Provincial Committee minutes' },
  { key: 'lodge_instruction', label: 'Lodge of Instruction', icon: BookOpen, color: 'bg-indigo-100 border-indigo-300 text-indigo-800', description: 'Educational materials and instruction' },
  { key: 'resources', label: 'Resources', icon: Archive, color: 'bg-gray-100 border-gray-300 text-gray-800', description: 'General Lodge resources' },
  { key: 'solomon', label: 'Solomon', icon: BookOpen, color: 'bg-yellow-100 border-yellow-300 text-yellow-800', description: 'Solomon-related materials' },
  { key: 'bylaws', label: 'Bylaws', icon: FileText, color: 'bg-red-100 border-red-300 text-red-800', description: 'Lodge bylaws and regulations' },
  { key: 'forms', label: 'Forms', icon: FileText, color: 'bg-pink-100 border-pink-300 text-pink-800', description: 'Lodge forms and applications' },
  { key: 'ritual', label: 'Ritual', icon: BookOpen, color: 'bg-orange-100 border-orange-300 text-orange-800', description: 'Ritual and ceremonial materials' },
  { key: 'other', label: 'Other', icon: FileText, color: 'bg-neutral-100 border-neutral-300 text-neutral-800', description: 'Miscellaneous documents' }
];

const MembersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, profile: userProfile, loading: authLoading, needsPasswordReset } = useAuth();
  
  // State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<(LodgeDocument | MeetingMinutes)[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({
    total_documents: 0,
    minutes: 0
  });
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  // Accessibility and layout preferences
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [highContrast, setHighContrast] = useState(false);

  // Handle navigation for non-authenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (!authLoading && user && userProfile?.status === 'pending') {
      navigate('/members/pending', { replace: true });
      return;
    }
    
    if (!authLoading && user && needsPasswordReset) {
      navigate('/password-reset', { replace: true });
      return;
    }
  }, [authLoading, user, userProfile?.status, needsPasswordReset, navigate]);

  // Load minimal initial data for dashboard
  useEffect(() => {
    if (!user || authLoading) return;

    const loadInitialData = async () => {
      try {
        setLoading(false); // Don't show loading for initial minimal load
        setError(null);

        // Just set some placeholder counts - we'll load real counts on demand
        setDocumentCounts({
          total_documents: 0,
          minutes: 0
        });
        setInitialDataLoaded(true);

      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load dashboard data');
      }
    };

    loadInitialData();
  }, [user, authLoading]);

  // Load counts only when needed (on first interaction)
  const loadCountsOnDemand = useCallback(async () => {
    if (documentCounts.counts_loaded) return;

    try {
      // Use count queries instead of loading all data
      const [documentsCountResult, minutesCountResult] = await Promise.allSettled([
        supabase.from('lodge_documents').select('category', { count: 'exact', head: true }),
        supabase.from('meeting_minutes').select('*', { count: 'exact', head: true })
      ]);

      const counts: Record<string, number> = {};
      
      // Set total documents count
      if (documentsCountResult.status === 'fulfilled') {
        counts.total_documents = documentsCountResult.value.count || 0;
      }
      
      // Set minutes count
      if (minutesCountResult.status === 'fulfilled') {
        counts.minutes = minutesCountResult.value.count || 0;
      }
      
      // For category-specific counts, we'll load them individually when needed
      counts.counts_loaded = 1;
      
      setDocumentCounts(counts);
    } catch (err) {
      console.error('Error loading counts on demand:', err);
    }
  }, [documentCounts]);

  // Load specific category count when user hovers over it
  const loadCategoryCount = useCallback(async (categoryKey: string) => {
    if (documentCounts[categoryKey] !== undefined) return;

    try {
      if (categoryKey === 'minutes') {
        return; // Already loaded
      }

      const { count, error } = await supabase
        .from('lodge_documents')
        .select('*', { count: 'exact', head: true })
        .eq('category', categoryKey);

      if (!error) {
        setDocumentCounts(prev => ({
          ...prev,
          [categoryKey]: count || 0
        }));
      }
    } catch (err) {
      console.error(`Error loading count for ${categoryKey}:`, err);
    }
  }, [documentCounts]);

  // Load documents for selected category (lazy loading)
  useEffect(() => {
    if (!selectedCategory) {
      setDocuments([]);
      return;
    }

    const loadCategoryDocuments = async () => {
      try {
        setCategoryLoading(true);
        
        if (selectedCategory === 'minutes') {
          const minutesData = await api.getMeetingMinutes();
          const filteredMinutes = minutesData.filter(m => 
            searchTerm === '' || 
            m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.content.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setDocuments(filteredMinutes);
        } else {
          const categoryDocs = await api.getLodgeDocuments(selectedCategory);
          const filteredDocs = categoryDocs.filter(doc => 
            searchTerm === '' ||
            doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
          );
          setDocuments(filteredDocs);
        }
      } catch (err) {
        console.error('Error loading category documents:', err);
        setError('Failed to load documents');
      } finally {
        setCategoryLoading(false);
      }
    };

    loadCategoryDocuments();
  }, [selectedCategory, searchTerm]);

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
  if (!user) {
    return null;
  }

  // Font size classes
  const fontSizeClasses = {
    normal: '',
    large: 'text-lg',
    'extra-large': 'text-xl'
  };

  const headingFontSizeClasses = {
    normal: '',
    large: 'text-xl',
    'extra-large': 'text-2xl'
  };

  return (
    <div className={`min-h-screen pb-20 ${highContrast ? 'bg-black text-white' : 'bg-gradient-to-br from-neutral-50 to-neutral-100'}`}>
      <div className="container mx-auto px-4 md:px-6">
        {/* Accessibility Controls */}
        <div className={`${highContrast ? 'bg-gray-900 border-gray-600' : 'bg-white border-neutral-200'} rounded-lg shadow-soft p-4 mb-6 border`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h3 className={`font-medium ${highContrast ? 'text-white' : 'text-primary-600'}`}>
                Display Options:
              </h3>
              
              {/* Font Size Controls */}
              <div className="flex items-center space-x-2">
                <Type size={16} className={highContrast ? 'text-gray-300' : 'text-neutral-500'} />
                <Button
                  variant={fontSize === 'normal' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFontSize('normal')}
                >
                  A
                </Button>
                <Button
                  variant={fontSize === 'large' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFontSize('large')}
                  className="text-lg"
                >
                  A
                </Button>
                <Button
                  variant={fontSize === 'extra-large' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFontSize('extra-large')}
                  className="text-xl"
                >
                  A
                </Button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex items-center"
                >
                  <List size={16} className="mr-1" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="flex items-center"
                >
                  <Grid size={16} className="mr-1" />
                  Grid
                </Button>
              </div>

              {/* High Contrast Toggle */}
              <Button
                variant={highContrast ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setHighContrast(!highContrast)}
                className="flex items-center"
              >
                <Eye size={16} className="mr-1" />
                High Contrast
              </Button>
            </div>
          </div>
        </div>

        {/* Welcome Header */}
        <div className={`${highContrast ? 'bg-gray-900 border-gray-600' : 'bg-white border-neutral-200'} rounded-lg shadow-soft p-6 mb-6 border`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className={`w-16 h-16 ${highContrast ? 'bg-gray-700' : 'bg-gradient-to-br from-primary-500 to-primary-600'} rounded-lg flex items-center justify-center mr-4`}>
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-heading font-bold ${highContrast ? 'text-white' : 'text-primary-600'} ${headingFontSizeClasses[fontSize]}`}>
                  Welcome, {userProfile?.full_name || user?.email?.split('@')[0] || 'Member'}
                </h1>
                <p className={`${highContrast ? 'text-gray-300' : 'text-neutral-600'} ${fontSizeClasses[fontSize]}`}>
                  {userProfile?.position || 'Member'} • Radlett Lodge No. 6652
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isAdmin && (
                <div className={`flex items-center px-4 py-2 ${highContrast ? 'bg-yellow-900 text-yellow-200 border-yellow-600' : 'bg-secondary-100 text-secondary-700 border-secondary-200'} rounded-full text-sm font-medium border`}>
                  <Shield className="w-4 h-4 mr-2" />
                  Administrator
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/members/profile')}
                className="flex items-center"
              >
                <Edit size={16} className="mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className={`${highContrast ? 'bg-red-900 border-red-600 text-red-200' : 'bg-red-50 border-red-200'} rounded-lg p-4 mb-6 border`}>
            <div className="flex items-start">
              <AlertTriangle className={`w-6 h-6 ${highContrast ? 'text-red-300' : 'text-red-500'} mr-3 mt-0.5 flex-shrink-0`} />
              <div className={`${fontSizeClasses[fontSize]}`}>
                <h3 className={`font-medium ${highContrast ? 'text-red-200' : 'text-red-800'} mb-1`}>Error</h3>
                <p className={highContrast ? 'text-red-300' : 'text-red-700'}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`${highContrast ? 'bg-gray-900 border-gray-600' : 'bg-white border-neutral-200'} rounded-lg p-6 shadow-soft border`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 ${highContrast ? 'bg-blue-800' : 'bg-blue-100'} rounded-lg flex items-center justify-center mr-4`}>
                <FileText className={`w-6 h-6 ${highContrast ? 'text-blue-200' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className={`text-3xl font-bold ${highContrast ? 'text-white' : 'text-primary-600'} ${headingFontSizeClasses[fontSize]}`}>
                  {documentCounts.total_documents || 0}
                </p>
                <p className={`${highContrast ? 'text-gray-300' : 'text-neutral-500'} ${fontSizeClasses[fontSize]}`}>Total Documents</p>
              </div>
            </div>
          </div>
          
          <div className={`${highContrast ? 'bg-gray-900 border-gray-600' : 'bg-white border-neutral-200'} rounded-lg p-6 shadow-soft border`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 ${highContrast ? 'bg-green-800' : 'bg-green-100'} rounded-lg flex items-center justify-center mr-4`}>
                <Clock className={`w-6 h-6 ${highContrast ? 'text-green-200' : 'text-green-600'}`} />
              </div>
              <div>
                <p className={`text-3xl font-bold ${highContrast ? 'text-white' : 'text-primary-600'} ${headingFontSizeClasses[fontSize]}`}>
                  {documentCounts.minutes || 0}
                </p>
                <p className={`${highContrast ? 'text-gray-300' : 'text-neutral-500'} ${fontSizeClasses[fontSize]}`}>Meeting Minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Quick Actions */}
          <div className="lg:col-span-1">
            <div className={`${highContrast ? 'bg-gray-900 border-gray-600' : 'bg-white border-neutral-200'} rounded-lg shadow-soft p-6 border sticky top-6`}>
              <h3 className={`text-xl font-heading font-semibold ${highContrast ? 'text-white' : 'text-primary-600'} mb-6 flex items-center ${headingFontSizeClasses[fontSize]}`}>
                <Settings className="w-6 h-6 mr-3" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  fullWidth 
                  size="sm"
                  className={`justify-start ${fontSizeClasses[fontSize]} py-3`}
                  onClick={() => navigate('/members/directory')}
                >
                  <Users size={18} className="mr-3" />
                  Member Directory
                  <ChevronRight size={18} className="ml-auto" />
                </Button>
                
                <Button 
                  variant="outline" 
                  fullWidth 
                  size="sm"
                  className={`justify-start ${fontSizeClasses[fontSize]} py-3`}
                  onClick={() => navigate('/events')}
                >
                  <Calendar size={18} className="mr-3" />
                  Lodge Events
                  <ChevronRight size={18} className="ml-auto" />
                </Button>
                
                {isAdmin && (
                  <>
                    <div className={`border-t ${highContrast ? 'border-gray-600' : 'border-neutral-200'} my-4`}></div>
                    <Button 
                      variant="primary" 
                      fullWidth 
                      size="sm"
                      className={`justify-start ${fontSizeClasses[fontSize]} py-3`}
                      onClick={() => navigate('/members/cms')}
                    >
                      <Edit size={18} className="mr-3" />
                      Content Management
                      <ChevronRight size={18} className="ml-auto" />
                    </Button>
                    
                    <Button 
                      variant="secondary" 
                      fullWidth 
                      size="sm"
                      className={`justify-start ${fontSizeClasses[fontSize]} py-3`}
                      onClick={() => navigate('/members/admin')}
                    >
                      <Settings size={18} className="mr-3" />
                      Admin Dashboard
                      <ChevronRight size={18} className="ml-auto" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Document Categories */}
          <div className="lg:col-span-3">
            {!selectedCategory ? (
              <div className={`${highContrast ? 'bg-gray-900 border-gray-600' : 'bg-white border-neutral-200'} rounded-lg shadow-soft p-8 border`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-2xl font-heading font-semibold ${highContrast ? 'text-white' : 'text-primary-600'} flex items-center ${headingFontSizeClasses[fontSize]}`}>
                    <Archive className="w-7 h-7 mr-3" />
                    Document Categories
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadCountsOnDemand}
                    className="flex items-center"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Load Counts
                  </Button>
                </div>
                
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                  {DOCUMENT_CATEGORIES.map((category) => {
                    const count = documentCounts[category.key];
                    const IconComponent = category.icon;
                    
                    return (
                      <button
                        key={category.key}
                        onClick={() => {
                          setSelectedCategory(category.key);
                          loadCountsOnDemand();
                        }}
                        onMouseEnter={() => loadCategoryCount(category.key)}
                        className={`p-6 rounded-lg border-2 ${
                          highContrast 
                            ? 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700' 
                            : `${category.color} hover:shadow-medium`
                        } transition-all group text-left w-full`}
                      >
                        <div className={`flex ${viewMode === 'grid' ? 'flex-col items-center text-center' : 'items-center'}`}>
                          <div className={`${viewMode === 'grid' ? 'w-12 h-12 mb-4' : 'w-10 h-10 mr-4'} rounded-lg ${
                            highContrast ? 'bg-gray-700' : 'bg-white'
                          } flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm`}>
                            <IconComponent 
                              size={viewMode === 'grid' ? 24 : 20} 
                              className={`${
                                highContrast 
                                  ? 'text-gray-300 group-hover:text-white' 
                                  : 'text-neutral-600 group-hover:text-primary-600'
                              }`} 
                            />
                          </div>
                          <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                            <h4 className={`font-semibold ${
                              highContrast ? 'text-white group-hover:text-gray-100' : 'text-neutral-800 group-hover:text-primary-600'
                            } mb-2 ${fontSizeClasses[fontSize]}`}>
                              {category.label}
                            </h4>
                            <p className={`${
                              highContrast ? 'text-gray-400' : 'text-neutral-600'
                            } text-sm mb-2 ${viewMode === 'list' ? 'line-clamp-1' : ''}`}>
                              {category.description}
                            </p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              highContrast 
                                ? 'bg-gray-700 text-gray-200' 
                                : 'bg-neutral-100 text-neutral-700'
                            }`}>
                              {count !== undefined ? `${count} documents` : 'Loading...'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Initial Loading State */}
                {loading && (
                  <div className="text-center py-12">
                    <LoadingSpinner subtle={true} />
                    <p className={`${highContrast ? 'text-gray-300' : 'text-neutral-500'} mt-4 ${fontSizeClasses[fontSize]}`}>
                      Loading dashboard...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Document Browser */
              <div className={`${highContrast ? 'bg-gray-900 border-gray-600' : 'bg-white border-neutral-200'} rounded-lg shadow-soft border`}>
                <div className={`p-6 border-b ${highContrast ? 'border-gray-600 bg-gray-800' : 'border-neutral-200 bg-neutral-50'} rounded-t-lg`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center">
                      {(() => {
                        const selectedCategoryObject = DOCUMENT_CATEGORIES.find(cat => cat.key === selectedCategory);
                        const IconComponent = selectedCategoryObject?.icon;
                        return IconComponent ? <IconComponent size={24} className={`mr-3 ${highContrast ? 'text-gray-300' : 'text-primary-600'}`} /> : null;
                      })()}
                      <div>
                        <h3 className={`text-2xl font-heading font-semibold ${highContrast ? 'text-white' : 'text-primary-600'} ${headingFontSizeClasses[fontSize]}`}>
                          {DOCUMENT_CATEGORIES.find(cat => cat.key === selectedCategory)?.label}
                        </h3>
                        <p className={`${highContrast ? 'text-gray-300' : 'text-neutral-500'} ${fontSizeClasses[fontSize]}`}>
                          {documents.length} document{documents.length !== 1 ? 's' : ''} available
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search documents..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-64 px-4 py-3 pr-12 border ${
                            highContrast 
                              ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                              : 'border-neutral-300 bg-white'
                          } rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 ${fontSizeClasses[fontSize]}`}
                        />
                        <Search className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${highContrast ? 'text-gray-400' : 'text-neutral-400'}`} size={18} />
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(null);
                          setSearchTerm('');
                        }}
                        className={fontSizeClasses[fontSize]}
                      >
                        ← Back to Categories
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {categoryLoading ? (
                    <div className="text-center py-16">
                      <LoadingSpinner subtle={true} />
                      <p className={`${highContrast ? 'text-gray-300' : 'text-neutral-500'} mt-4 ${fontSizeClasses[fontSize]}`}>
                        Loading documents...
                      </p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-16">
                      <div className={`w-16 h-16 ${highContrast ? 'bg-gray-700' : 'bg-neutral-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Search className={`w-8 h-8 ${highContrast ? 'text-gray-400' : 'text-neutral-300'}`} />
                      </div>
                      <h4 className={`text-xl font-medium ${highContrast ? 'text-white' : 'text-neutral-600'} mb-3 ${headingFontSizeClasses[fontSize]}`}>
                        No Documents Found
                      </h4>
                      <p className={`${highContrast ? 'text-gray-300' : 'text-neutral-500'} ${fontSizeClasses[fontSize]}`}>
                        {searchTerm 
                          ? `No documents match "${searchTerm}" in this category.`
                          : 'No documents available in this category yet.'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className={`space-y-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0' : ''}`}>
                      {documents.map((doc) => {
                        const isMinute = 'meeting_date' in doc;
                        
                        return (
                          <div
                            key={doc.id}
                            className={`p-6 ${
                              highContrast 
                                ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' 
                                : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 hover:shadow-medium'
                            } rounded-lg border transition-all`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-grow">
                                <h4 className={`font-semibold ${highContrast ? 'text-white' : 'text-primary-600'} mb-3 leading-relaxed ${fontSizeClasses[fontSize]}`}>
                                  {doc.title}
                                </h4>
                                
                                {isMinute ? (
                                  <>
                                    <p className={`${highContrast ? 'text-gray-300' : 'text-neutral-600'} mb-4 line-clamp-3 leading-relaxed ${fontSizeClasses[fontSize]}`}>
                                      {doc.content.substring(0, 200)}...
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className={`font-medium px-3 py-2 rounded-lg ${
                                        highContrast 
                                          ? 'bg-green-900 text-green-200 border border-green-700' 
                                          : 'bg-green-100 text-green-800 border border-green-200'
                                      } ${fontSizeClasses[fontSize]}`}>
                                        Meeting Minutes
                                      </span>
                                      <span className={`${highContrast ? 'text-gray-400' : 'text-neutral-500'} ${fontSizeClasses[fontSize]}`}>
                                        {new Date((doc as MeetingMinutes).meeting_date).toLocaleDateString('en-GB')}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {(doc as LodgeDocument).description && (
                                      <p className={`${highContrast ? 'text-gray-300' : 'text-neutral-600'} mb-4 line-clamp-3 leading-relaxed ${fontSizeClasses[fontSize]}`}>
                                        {(doc as LodgeDocument).description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className={`font-medium px-3 py-2 rounded-lg ${
                                        highContrast 
                                          ? 'bg-gray-700 text-gray-200 border border-gray-600' 
                                          : 'bg-neutral-200 text-neutral-800 border border-neutral-300'
                                      } ${fontSizeClasses[fontSize]}`}>
                                        {(doc as LodgeDocument).category.replace('_', ' ').toUpperCase()}
                                      </span>
                                      <span className={`${highContrast ? 'text-gray-400' : 'text-neutral-500'} ${fontSizeClasses[fontSize]}`}>
                                        Added {new Date(doc.created_at).toLocaleDateString('en-GB')}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              <div className="ml-6 flex-shrink-0">
                                <a
                                  href={isMinute ? (doc as any).document_url || '#' : (doc as LodgeDocument).url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center px-6 py-3 ${
                                    highContrast 
                                      ? 'bg-blue-800 text-blue-100 hover:bg-blue-700 border border-blue-600' 
                                      : 'bg-primary-600 text-white hover:bg-primary-700'
                                  } rounded-lg transition-colors font-medium ${fontSizeClasses[fontSize]}`}
                                >
                                  <ExternalLink size={18} className="mr-2" />
                                  Open Document
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersPage;