import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { optimizedApi as api } from '../lib/optimizedApi';
import { dataCache } from '../lib/dataCache';
import { LodgeDocument, MeetingMinutes, MemberProfile } from '../types';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { usePagination } from '../hooks/usePagination';
import PaginationControls from '../components/PaginationControls';
import VirtualizedList from '../components/VirtualizedList';
import { Plus, FileText, Clock, Pencil, Trash2, ExternalLink, Building2, Landmark, Users, AlertTriangle, BookOpen, ScrollText, Archive, LogOut } from 'lucide-react';
import DocumentForm from '../components/DocumentForm';
import MinutesForm from '../components/MinutesForm';
import MemberProfileAdminForm from '../components/MemberProfileAdminForm';

type TabType = 'members' | 'documents' | 'grand_lodge' | 'provincial' | 'summons' | 'lodge_instruction' | 'resources' | 'minutes' | 'gpc_minutes';

const AdminPage: React.FC = () => {
  // ALL HOOKS MUST BE DECLARED FIRST - BEFORE ANY CONDITIONAL RETURNS
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut, needsPasswordReset } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showMinutesForm, setShowMinutesForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<LodgeDocument | null>(null);
  const [editingMinute, setEditingMinute] = useState<MeetingMinutes | null>(null);
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [allDocuments, setAllDocuments] = useState<LodgeDocument[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinutes[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [paginatedDocuments, setPaginatedDocuments] = useState<{
    documents: LodgeDocument[];
    total: number;
    hasMore: boolean;
  }>({ documents: [], total: 0, hasMore: false });
  
  // Define filteredDocuments based on activeTab
  const filteredDocuments = activeTab === 'documents' 
    ? allDocuments 
    : allDocuments.filter(doc => doc.category === activeTab);
  
  // Pagination for documents
  const [documentsPagination, documentsPaginationActions] = usePagination({
    initialPage: 1,
    initialPageSize: 20
  });
  
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

  // Load paginated documents when tab or pagination changes
  const loadPaginatedDocuments = useCallback(async () => {
    if (activeTab === 'members' || activeTab === 'minutes') return;
    
    try {
      setLoading(true);
      const category = activeTab === 'documents' ? undefined : activeTab;
      
      const result = await api.getLodgeDocumentsPaginated(
        documentsPagination.currentPage,
        documentsPagination.pageSize,
        category
      );
      setPaginatedDocuments(result);
      documentsPaginationActions.setTotalItems(result.total);
    } catch (err) {
      console.error('Error loading paginated documents:', err);
      showError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [activeTab, documentsPagination.currentPage, documentsPagination.pageSize, documentsPaginationActions, showError]);

  // Load paginated documents when dependencies change
  useEffect(() => {
    if (dataLoaded) {
      loadPaginatedDocuments();
    }
  }, [loadPaginatedDocuments, dataLoaded]);

  // Memoize document counts with caching
  const documentCounts = useMemo(() => {
    const counts = {
      all: allDocuments.length,
      grand_lodge: 0,
      provincial: 0,
      summons: 0,
      lodge_instruction: 0,
      resources: 0,
      minutes: minutes.length,
      members: members.length,
      gpc_minutes: 0
    };
    
    // Only calculate category counts if we have documents
    if (allDocuments.length > 0) {
      allDocuments.forEach(doc => {
        if (doc.category in counts) {
          (counts as any)[doc.category]++;
        }
      });
    }
    
    return counts;
  }, [allDocuments.length, minutes.length, members.length]);

  // Handle navigation for non-admin users
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/members', { replace: true });
    }
    
    // Redirect users who need password reset
    if (!authLoading && user && needsPasswordReset) {
      navigate('/password-reset', { replace: true });
    }
  }, [authLoading, user, isAdmin, navigate]);

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

  useEffect(() => {
    const loadData = async () => {
      // Don't load if still authenticating or no user or already loaded
      if (authLoading || !user || dataLoaded) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load all data in parallel
        const [minutesData, membersData] = await Promise.all([
          api.getMeetingMinutes(),
          api.getAllMembers()
        ]);

        setMinutes(minutesData);
        setMembers(membersData);
        
        // Load initial document counts for tabs (without full data)
        const documentCategoryCounts = await Promise.all([
          api.getLodgeDocuments().then(docs => ({ all: docs.length, docs })),
        ]);
        
        setAllDocuments(documentCategoryCounts[0].docs);
        
        setDataLoaded(true);
      } catch (err) {
        console.error('Error loading admin data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        showError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, dataLoaded, showError]);

  const handleDocumentSubmit = async (document: Omit<LodgeDocument, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingDocument) {
        // Update existing document
        await api.updateDocument(editingDocument.id, document);
        success('Document updated successfully');
        // Invalidate cache and reload
        api.invalidateCache.documents(document.category);
        loadPaginatedDocuments();
      } else {
        // Create new document
        await api.createDocument(document);
        success('Document added successfully');
        // Invalidate cache and reload
        api.invalidateCache.documents(document.category);
        loadPaginatedDocuments();
      }
      setShowDocumentForm(false);
      setEditingDocument(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      showError(editingDocument ? 'Failed to update document' : 'Failed to add document');
    }
  };

  const handleMinutesSubmit = async (minutes: Omit<MeetingMinutes, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingMinute) {
        await api.updateMinutes(editingMinute.id, minutes);
        success('Meeting minutes updated successfully');
      } else {
        await api.createMinutes(minutes);
        success('Meeting minutes added successfully');
      }
      const updatedMinutes = await api.getMeetingMinutes();
      setMinutes(updatedMinutes);
      setShowMinutesForm(false);
      setEditingMinute(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      showError(editingMinute ? 'Failed to update meeting minutes' : 'Failed to add meeting minutes');
    }
  };

  const handleMemberSubmit = async (data: {
    user_id: string;
    full_name: string;
    position?: string;
    role: 'member' | 'admin';
  }) => {
    try {
      if (editingMember) {
        await api.updateMemberProfile(editingMember.user_id, data);
        success('Member profile updated successfully');
      } else {
        await api.adminCreateMemberProfile(data);
        success('Member profile created successfully');
      }
      
      const updatedMembers = await api.getAllMembers();
      setMembers(updatedMembers);
      
      setShowMemberForm(false);
      setEditingMember(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      showError(editingMember ? 'Failed to update member profile' : 'Failed to create member profile');
    }
  };

  const handleEditDocument = (document: LodgeDocument) => {
    setEditingDocument(document);
    setShowDocumentForm(true);
  };

  const handleCancelEditDocument = () => {
    setEditingDocument(null);
    setShowDocumentForm(false);
  };

  const handleDeleteDocument = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      onConfirm: async () => {
        try {
          // Delete document via API
          await api.deleteDocument(id);
          api.invalidateCache.documents();
          loadPaginatedDocuments();
          success('Document deleted successfully');
        } catch (err) {
          console.error('Delete error:', err);
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(`Failed to delete document: ${errorMessage}`);
          showError(`Failed to delete document: ${errorMessage}`);
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleEditMember = (member: MemberProfile) => {
    setEditingMember(member);
    setShowMemberForm(true);
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setShowMemberForm(false);
  };

  const handleEditMinute = (minute: MeetingMinutes) => {
    setEditingMinute(minute);
    setShowMinutesForm(true);
  };

  const handleCancelEditMinute = () => {
    setEditingMinute(null);
    setShowMinutesForm(false);
  };

  const handleDeleteMinute = async (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Meeting Minutes',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.deleteMinutes(id);
          const updatedMinutes = await api.getMeetingMinutes();
          setMinutes(updatedMinutes);
          success('Meeting minutes deleted successfully');
        } catch (err) {
          console.error('Delete error:', err);
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(`Failed to delete meeting minutes: ${errorMessage}`);
          showError(`Failed to delete meeting minutes: ${errorMessage}`);
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleDeleteMember = async (userId: string, memberName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Member',
      message: `Are you sure you want to permanently delete "${memberName}" and their profile? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setError(null);
          setDeletingUserId(userId);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          
          await api.deleteUserAndProfile(userId);
          const updatedMembers = await api.getAllMembers();
          setMembers(updatedMembers);
          success('Member deleted successfully');
        } catch (err) {
          console.error('Delete error:', err);
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(`Failed to delete user: ${errorMessage}`);
          showError(`Failed to delete member: ${errorMessage}`);
        } finally {
          setDeletingUserId(null);
        }
      }
    });
  };

  // Document row renderer for virtualized list
  const DocumentRow = ({ index, style, data }: { index: number; style: React.CSSProperties; data: LodgeDocument[] }) => {
    const doc = data[index];
    
    return (
      <div style={style} className="px-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4 flex items-center justify-between hover:shadow-soft transition-shadow">
          <div className="flex-grow">
            <h3 className="font-medium text-primary-600">{doc.title}</h3>
            {doc.description && (
              <p className="text-sm text-neutral-600 mt-1">{doc.description}</p>
            )}
            <div className="flex items-center mt-2">
              <span className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                {doc.category.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-xs text-neutral-500 ml-4">
                Added {new Date(doc.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-neutral-500 hover:text-primary-600 transition-colors"
              title="Open document"
            >
              <ExternalLink size={18} />
            </a>
            <button 
              className="p-2 text-neutral-500 hover:text-secondary-500 transition-colors"
              title="Edit document"
              onClick={() => handleEditDocument(doc)}
            >
              <Pencil size={18} />
            </button>
            <button 
              className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
              title="Delete document"
              onClick={() => handleDeleteDocument(doc.id)}
            >
              <Trash2 size={18} />
            </button>
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

  // Don't render anything if redirecting
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header with Sign Out */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary-600 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-neutral-600">
              Manage Lodge documents, meeting minutes, and member profiles
            </p>
          </div>
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

        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            variant={activeTab === 'members' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('members')}
            className="flex items-center"
          >
            <Users size={18} className="mr-2" />
            Members ({documentCounts.members})
          </Button>
          <Button
            variant={activeTab === 'documents' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('documents')}
            className="flex items-center"
          >
            <FileText size={18} className="mr-2" />
            All Documents ({documentCounts.all})
          </Button>
          <Button
            variant={activeTab === 'grand_lodge' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('grand_lodge')}
            className="flex items-center"
          >
            <Landmark size={18} className="mr-2" />
            Grand Lodge ({documentCounts.grand_lodge})
          </Button>
          <Button
            variant={activeTab === 'provincial' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('provincial')}
            className="flex items-center"
          >
            <Building2 size={18} className="mr-2" />
            Provincial ({documentCounts.provincial})
          </Button>
          <Button
            variant={activeTab === 'summons' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('summons')}
            className="flex items-center"
          >
            <ScrollText size={18} className="mr-2" />
            Summons ({documentCounts.summons})
          </Button>
          <Button
            variant={activeTab === 'lodge_instruction' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('lodge_instruction')}
            className="flex items-center"
          >
            <BookOpen size={18} className="mr-2" />
            Lodge of Instruction ({documentCounts.lodge_instruction})
          </Button>
          <Button
            variant={activeTab === 'resources' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('resources')}
            className="flex items-center"
          >
            <Archive size={18} className="mr-2" />
            Resources ({documentCounts.resources})
          </Button>
          <Button
            variant={activeTab === 'minutes' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('minutes')}
            className="flex items-center"
          >
            <Clock size={18} className="mr-2" />
            Minutes ({documentCounts.minutes})
          </Button>
          <Button
            variant={activeTab === 'gpc_minutes' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('gpc_minutes')}
            className="flex items-center"
          >
            <Clock size={18} className="mr-2" />
            GPC Minutes ({documentCounts.gpc_minutes})
          </Button>
        </div>

        {activeTab === 'members' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-semibold text-primary-600">
                Member Profiles ({members.length})
              </h2>
              <Button
                onClick={() => setShowMemberForm(true)}
                className="flex items-center"
              >
                <Plus size={18} className="mr-2" />
                Add Member
              </Button>
            </div>

            {showMemberForm && (
              <div className="bg-neutral-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-primary-600 mb-4">
                  {editingMember ? 'Edit Member Profile' : 'Add New Member Profile'}
                </h3>
                <MemberProfileAdminForm
                  onSubmit={handleMemberSubmit}
                  onCancel={handleCancelEdit}
                  initialData={editingMember || undefined}
                />
              </div>
            )}

            {loading ? (
              <LoadingSpinner subtle={true} className="py-8" />
            ) : members.length === 0 ? (
              <div className="text-center py-8 bg-neutral-50 rounded-lg">
                <p className="text-neutral-600">No member profiles found.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-lg border border-neutral-200 p-4 flex items-center justify-between hover:shadow-soft transition-shadow"
                  >
                    <div className="flex-grow">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-primary-600">{member.full_name}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          member.role === 'admin'
                            ? 'bg-secondary-100 text-secondary-700'
                            : member.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : member.status === 'inactive'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                        }`}>
                          {member.role} {member.status && `(${member.status})`}
                        </span>
                      </div>
                      {member.position && (
                        <p className="text-sm text-neutral-600 mt-1">{member.position}</p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-neutral-500">
                        <span>User ID: {member.user_id}</span>
                        <span className="mx-2">•</span>
                        <span>Registered {new Date(member.registration_date || member.created_at).toLocaleDateString('en-GB')}</span>
                        {member.last_login && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Last login {new Date(member.last_login).toLocaleDateString('en-GB')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button 
                        className="p-2 text-neutral-500 hover:text-secondary-500 transition-colors"
                        onClick={() => handleEditMember(member)}
                        title="Edit member"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className={`p-2 transition-colors ${
                          deletingUserId === member.user_id
                            ? 'text-neutral-400 cursor-not-allowed'
                            : 'text-neutral-500 hover:text-red-500'
                        }`}
                        onClick={() => handleDeleteMember(member.user_id, member.full_name)}
                        disabled={deletingUserId === member.user_id}
                        title="Delete member"
                      >
                        {deletingUserId === member.user_id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab !== 'minutes' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-semibold text-primary-600">
                {activeTab === 'documents' && `All Documents (${filteredDocuments.length})`}
                {activeTab === 'grand_lodge' && `Grand Lodge Communications (${filteredDocuments.length})`}
                {activeTab === 'provincial' && `Provincial Communications (${filteredDocuments.length})`}
                {activeTab === 'summons' && `Summons (${filteredDocuments.length})`}
                {activeTab === 'lodge_instruction' && `Lodge of Instruction Minutes (${filteredDocuments.length})`}
                {activeTab === 'resources' && `Resources (${filteredDocuments.length})`}
                {activeTab === 'gpc_minutes' && `GPC Minutes (${filteredDocuments.length})`}
              </h2>
              <Button
                onClick={() => setShowDocumentForm(true)}
                className="flex items-center"
              >
                <Plus size={18} className="mr-2" />
                Add Document
              </Button>
            </div>

            {showDocumentForm && (
              <div className="bg-neutral-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-primary-600 mb-4">
                  {editingDocument ? 'Edit Document' : 'Add New Document'}
                </h3>
                <DocumentForm
                  onSubmit={handleDocumentSubmit}
                  onCancel={handleCancelEditDocument}
                  initialData={editingDocument || undefined}
                />
              </div>
            )}

            {loading ? (
              <LoadingSpinner subtle={true} className="py-8" />
            ) : paginatedDocuments.documents.length === 0 ? (
              <div className="text-center py-8 bg-neutral-50 rounded-lg">
                <p className="text-neutral-600">
                  {activeTab === 'documents' 
                    ? 'No documents found.' 
                    : `No ${activeTab.replace('_', ' ')} documents found.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Virtualized list for better performance with large datasets */}
                <VirtualizedList
                  items={paginatedDocuments.documents}
                  height={600}
                  itemHeight={120}
                  renderItem={DocumentRow}
                  className="border border-neutral-200 rounded-lg"
                />
                
                {/* Pagination controls */}
                <PaginationControls
                  currentPage={documentsPagination.currentPage}
                  totalPages={documentsPagination.totalPages}
                  pageSize={documentsPagination.pageSize}
                  totalItems={paginatedDocuments.total}
                  onPageChange={documentsPaginationActions.setPage}
                  onPageSizeChange={documentsPaginationActions.setPageSize}
                  canGoNext={documentsPaginationActions.canGoNext}
                  canGoPrev={documentsPaginationActions.canGoPrev}
                  onFirstPage={documentsPaginationActions.goToFirstPage}
                  onLastPage={documentsPaginationActions.goToLastPage}
                  onNextPage={documentsPaginationActions.nextPage}
                  onPrevPage={documentsPaginationActions.prevPage}
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-semibold text-primary-600">
                Meeting Minutes ({minutes.length})
              </h2>
              <Button
                onClick={() => setShowMinutesForm(true)}
                className="flex items-center"
              >
                <Plus size={18} className="mr-2" />
                Add Minutes
              </Button>
            </div>

            {showMinutesForm && (
              <div className="bg-neutral-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-primary-600 mb-4">
                  {editingMinute ? 'Edit Meeting Minutes' : 'Add New Meeting Minutes'}
                </h3>
                <MinutesForm
                  onSubmit={handleMinutesSubmit}
                  onCancel={handleCancelEditMinute}
                  initialData={editingMinute || undefined}
                />
              </div>
            )}

            {loading ? (
              <LoadingSpinner subtle={true} className="py-8" />
            ) : minutes.length === 0 ? (
              <div className="text-center py-8 bg-neutral-50 rounded-lg">
                <p className="text-neutral-600">No meeting minutes found.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {minutes.map((minute) => (
                  <div
                    key={minute.id}
                    className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-soft transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-primary-600">{minute.title}</h3>
                        <p className="text-sm text-neutral-500 mt-1">
                          {new Date(minute.meeting_date).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {minute.document_url && (
                          <a
                            href={minute.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-neutral-500 hover:text-primary-600 transition-colors"
                            title="Open document"
                          >
                            <ExternalLink size={18} />
                          </a>
                        )}
                        <button 
                          className="p-2 text-neutral-500 hover:text-secondary-500 transition-colors"
                          onClick={() => handleEditMinute(minute)}
                          title="Edit minutes"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                          onClick={() => handleDeleteMinute(minute.id, minute.title)}
                          title="Delete minutes"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 text-neutral-600 whitespace-pre-wrap">
                      {minute.content}
                    </div>
                  </div>
                ))}
              </div>
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
  );
};

export default AdminPage;