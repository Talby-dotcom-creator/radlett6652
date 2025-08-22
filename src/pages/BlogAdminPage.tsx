import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Search } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { optimizedApi as api } from '../lib/optimizedApi';
import { useToast } from '../hooks/useToast';
import { CMSBlogPost } from '../types';
import BlogForm from '../components/cms/BlogForm';
import ContentPreview from '../components/cms/ContentPreview';

const BlogAdminPage: React.FC = () => {
  const { user, profile, needsPasswordReset } = useAuth();
  const [blogPosts, setBlogPosts] = useState<CMSBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<CMSBlogPost | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<CMSBlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { success, error: toastError } = useToast();

  // Redirect if not authenticated or not admin
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (needsPasswordReset) {
    return <Navigate to="/password-reset" replace />;
  }

  if (profile && profile.role !== 'admin') {
    return <Navigate to="/members" replace />;
  }

  const loadBlogPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBlogPosts();
      setBlogPosts(data);
    } catch (err) {
      console.error('Error loading blog posts:', err);
      setError('Failed to load blog posts.');
      toastError('Failed to load blog posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const handleCreate = () => {
    setEditingPost(null);
    setShowForm(true);
  };

  const handleEdit = (post: CMSBlogPost) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setPostToDelete(id);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (postToDelete) {
      try {
        await api.deleteBlogPost(postToDelete);
        success('Blog post deleted successfully!');
        loadBlogPosts();
      } catch (err) {
        console.error('Error deleting blog post:', err);
        toastError('Failed to delete blog post.');
      } finally {
        setPostToDelete(null);
        setShowConfirmDialog(false);
      }
    }
  };

  const handleFormSubmit = async (data: Omit<CMSBlogPost, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingPost) {
        await api.updateBlogPost(editingPost.id, data);
        success('Blog post updated successfully!');
      } else {
        await api.createBlogPost(data);
        success('Blog post created successfully!');
      }
      setShowForm(false);
      setEditingPost(null);
      loadBlogPosts();
    } catch (err) {
      console.error('Error saving blog post:', err);
      toastError('Failed to save blog post.');
    }
  };

  const handleTogglePublish = async (post: CMSBlogPost) => {
    try {
      await api.updateBlogPost(post.id, { is_published: !post.is_published });
      success(`Blog post ${post.is_published ? 'unpublished' : 'published'} successfully!`);
      loadBlogPosts();
    } catch (err) {
      console.error('Error toggling publish status:', err);
      toastError('Failed to toggle publish status.');
    }
  };

  const handlePreview = (post: CMSBlogPost) => {
    setPreviewContent(post);
    setShowPreview(true);
  };

  const filteredBlogPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (Array.isArray(post.tags) && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="min-h-screen pb-20 bg-neutral-50">
      <div className="container mx-auto px-4 md:px-6">
        <DashboardCard
          title="Blog Posts Management"
          icon={BookOpen}
          headerAction={
            <Button onClick={handleCreate} size="sm" className="flex items-center">
              <Plus size={16} className="mr-2" />
              New Blog Post
            </Button>
          }
        >
          {showForm ? (
            <BlogForm
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingPost(null);
              }}
              initialData={editingPost || undefined}
            />
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search blog posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-neutral-300 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                </div>
              </div>

              {loading ? (
                <LoadingSpinner subtle={true} className="py-8" />
              ) : filteredBlogPosts.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p>No content found.</p>
                  <p className="text-sm mt-1">Click "New Content" to create one.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBlogPosts.map((post) => (
                    <div key={post.id} className="bg-white border border-neutral-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
                      <div className="flex-grow">
                        <h3 className="font-semibold text-primary-600">{post.title}</h3>
                        <p className="text-sm text-neutral-600 line-clamp-1">{post.summary}</p>
                        <div className="flex items-center text-xs text-neutral-500 mt-2">
                          <span>{new Date(post.publish_date).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            post.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {post.is_published ? 'Published' : 'Draft'}
                          </span>
                          {post.is_members_only && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                Members Only
                              </span>
                            </>
                          )}
                          {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                {post.tags.join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handlePreview(post)} title="Preview">
                          <Eye size={16} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleTogglePublish(post)} title={post.is_published ? 'Unpublish' : 'Publish'}>
                          {post.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(post)} title="Edit">
                          <Edit size={16} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(post.id)} title="Delete">
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DashboardCard>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirm Deletion"
        message="Are you sure you want to delete this blog post? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setPostToDelete(null);
          setShowConfirmDialog(false);
        }}
        type="danger"
      />

      <ContentPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        content={previewContent}
        contentType="news"
      />
    </div>
  );
};

export default BlogAdminPage;