import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CMSNewsArticle } from '../../types';
import Button from '../Button';
import MediaManager from './MediaManager';
import { Image, X, Eye, EyeOff, Calendar, Tag, FileText } from 'lucide-react';

interface BlogPostFormProps {
  onSubmit: (data: Omit<CMSNewsArticle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CMSNewsArticle>;
}

const BlogPostForm: React.FC<BlogPostFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(initialData?.image_url || '');
  const [previewMode, setPreviewMode] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: initialData?.title || '',
      summary: initialData?.summary || '',
      content: initialData?.content || '',
      image_url: initialData?.image_url || '',
      publish_date: initialData?.publish_date || new Date().toISOString().split('T')[0],
      is_members_only: initialData?.is_members_only || false,
      is_published: initialData?.is_published !== undefined ? initialData.is_published : false
    }
  });

  const watchedContent = watch('content');
  const watchedTitle = watch('title');
  const watchedSummary = watch('summary');
  const watchedIsPublished = watch('is_published');

  const handleMediaSelect = (url: string) => {
    setSelectedImageUrl(url);
    setValue('image_url', url, { shouldDirty: true });
    setShowMediaManager(false);
  };

  const handleClearImage = () => {
    setSelectedImageUrl('');
    setValue('image_url', '', { shouldDirty: true });
  };

  const handleFormSubmit = async (data: any) => {
    await onSubmit({
      ...data,
      image_url: selectedImageUrl || data.image_url
    });
  };

  const renderPreview = () => (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <h2 className="text-2xl font-heading font-bold text-primary-600 mb-4">Blog Post Preview</h2>
      
      {selectedImageUrl && (
        <img
          src={selectedImageUrl}
          alt={watchedTitle || 'Blog post preview'}
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
      )}
      
      <h1 className="text-3xl font-heading font-bold text-primary-600 mb-4">
        {watchedTitle || 'Blog Post Title'}
      </h1>
      
      <div className="flex items-center space-x-4 text-sm text-neutral-500 mb-6">
        <span className="flex items-center">
          <Calendar size={16} className="mr-1" />
          {new Date().toLocaleDateString('en-GB')}
        </span>
        <span className="flex items-center">
          <Tag size={16} className="mr-1" />
          Blog Post
        </span>
      </div>
      
      <div className="bg-neutral-50 p-4 rounded-lg mb-6">
        <p className="text-lg font-medium text-neutral-700">
          {watchedSummary || 'Blog post summary will appear here...'}
        </p>
      </div>
      
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ 
          __html: watchedContent || '<p>Blog post content will appear here...</p>' 
        }}
      />
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header with Preview Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-primary-600">
            {initialData ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h2>
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center"
            >
              {previewMode ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${watchedIsPublished ? 'text-green-600' : 'text-yellow-600'}`}>
                {watchedIsPublished ? 'Published' : 'Draft'}
              </span>
              <div className={`w-3 h-3 rounded-full ${watchedIsPublished ? 'bg-green-500' : 'bg-yellow-500'}`} />
            </div>
          </div>
        </div>

        {previewMode ? (
          renderPreview()
        ) : (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-primary-600 mb-6 flex items-center">
                <FileText size={20} className="mr-2" />
                Basic Information
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-primary-600 mb-2">
                    Blog Post Title *
                  </label>
                  <input
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-md focus:border-secondary-500 focus:ring-secondary-500"
                    placeholder="Enter an engaging title for your blog post"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message as string}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-primary-600 mb-2">
                    Summary/Excerpt *
                  </label>
                  <textarea
                    id="summary"
                    {...register('summary', { required: 'Summary is required' })}
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:border-secondary-500 focus:ring-secondary-500"
                    placeholder="Write a compelling summary that will appear in blog previews and search results"
                  />
                  {errors.summary && (
                    <p className="mt-1 text-sm text-red-600">{errors.summary.message as string}</p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">
                    This summary will appear on the blog listing page and in social media previews.
                  </p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-primary-600 mb-6">Content</h3>
              
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-primary-600 mb-2">
                  Blog Post Content (HTML) *
                </label>
                <textarea
                  id="content"
                  {...register('content', { required: 'Content is required' })}
                  rows={15}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:border-secondary-500 focus:ring-secondary-500 font-mono text-sm"
                  placeholder="<p>Write your blog post content here using HTML tags...</p>

<h2>Section Heading</h2>
<p>You can use HTML tags like &lt;p&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, etc.</p>

<p>For links: &lt;a href='https://example.com'&gt;Link text&lt;/a&gt;</p>
<p>For emphasis: &lt;strong&gt;Bold text&lt;/strong&gt; and &lt;em&gt;Italic text&lt;/em&gt;</p>"
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message as string}</p>
                )}
                <div className="mt-2 text-xs text-neutral-500 space-y-1">
                  <p><strong>HTML Tips:</strong></p>
                  <p>• Use &lt;h2&gt; and &lt;h3&gt; for section headings</p>
                  <p>• Wrap paragraphs in &lt;p&gt; tags</p>
                  <p>• Use &lt;strong&gt; for bold and &lt;em&gt; for italic text</p>
                  <p>• Create links with &lt;a href="URL"&gt;Link text&lt;/a&gt;</p>
                </div>
              </div>
            </div>

            {/* Media Section */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-primary-600 mb-6 flex items-center">
                <Image size={20} className="mr-2" />
                Featured Image
              </h3>
              
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    id="image_url"
                    type="url"
                    {...register('image_url')}
                    value={selectedImageUrl}
                    onChange={(e) => {
                      setSelectedImageUrl(e.target.value);
                      setValue('image_url', e.target.value, { shouldDirty: true });
                    }}
                    className="flex-1 px-4 py-3 border border-neutral-300 rounded-md focus:border-secondary-500 focus:ring-secondary-500"
                    placeholder="https://example.com/image.jpg or use Media Manager"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMediaManager(true)}
                    className="flex items-center px-4"
                  >
                    <Image size={16} className="mr-2" />
                    Browse Media
                  </Button>
                  {selectedImageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearImage}
                      className="flex items-center px-3 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>

                {selectedImageUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-neutral-700 mb-3">Featured Image Preview:</p>
                    <div className="relative inline-block">
                      <img
                        src={selectedImageUrl}
                        alt="Featured image preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-neutral-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-neutral-500">
                  The featured image will appear at the top of your blog post and in blog previews. 
                  Recommended size: 1200x630px for optimal social media sharing.
                </p>
              </div>
            </div>

            {/* Publishing Options */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-primary-600 mb-6 flex items-center">
                <Calendar size={20} className="mr-2" />
                Publishing Options
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="publish_date" className="block text-sm font-medium text-primary-600 mb-2">
                    Publish Date
                  </label>
                  <input
                    id="publish_date"
                    type="date"
                    {...register('publish_date', { required: 'Publish date is required' })}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:border-secondary-500 focus:ring-secondary-500"
                  />
                  {errors.publish_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.publish_date.message as string}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="is_published"
                      type="checkbox"
                      {...register('is_published')}
                      className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-neutral-300 rounded"
                    />
                    <label htmlFor="is_published" className="ml-3 block text-sm font-medium text-neutral-700">
                      Publish immediately
                    </label>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Uncheck to save as draft. You can publish later from the blog management page.
                  </p>

                  <div className="flex items-center">
                    <input
                      id="is_members_only"
                      type="checkbox"
                      {...register('is_members_only')}
                      className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-neutral-300 rounded"
                    />
                    <label htmlFor="is_members_only" className="ml-3 block text-sm font-medium text-neutral-700">
                      Members only content
                    </label>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Check this if the content should only be visible to logged-in members.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-neutral-200">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setValue('is_published', false)}
                >
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  onClick={() => setValue('is_published', true)}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Blog Post'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Media Manager Modal */}
      <MediaManager
        isOpen={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        onSelectMedia={handleMediaSelect}
      />
    </>
  );
};

export default BlogPostForm;