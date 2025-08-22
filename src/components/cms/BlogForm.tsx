import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CMSBlogPost } from '../../types';
import Button from '../Button';
import MediaManager from './MediaManager';
import BlogImportArea from './BlogImportArea';
import { Image, X } from 'lucide-react';

interface BlogFormProps {
  onSubmit: (data: Omit<CMSBlogPost, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CMSBlogPost>;
}

const BlogForm: React.FC<BlogFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(initialData?.image_url || '');
   const [showImportArea, setShowImportArea] = useState(true); // Temporary change for debugging


  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: initialData?.title || '',
      summary: initialData?.summary || '',
      content: initialData?.content || '',
      image_url: initialData?.image_url || '',
      category: initialData?.category || 'blog',
      publish_date: initialData?.publish_date || new Date().toISOString().split('T')[0],
      is_members_only: initialData?.is_members_only || false,
      is_published: initialData?.is_published !== undefined ? initialData.is_published : true,
      tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : (initialData?.tags || '')
    }
  });

  const watchedImageUrl = watch('image_url');

  const handleMediaSelect = (url: string) => {
    setSelectedImageUrl(url);
    setValue('image_url', url, { shouldDirty: true });
    setShowMediaManager(false);
  };

  const handleContentImported = (importedContent: {
    title: string;
    summary: string;
    content: string;
    tags?: string[];
  }) => {
    // Populate form fields with imported content
    setValue('title', importedContent.title, { shouldDirty: true });
    setValue('summary', importedContent.summary, { shouldDirty: true });
    setValue('content', importedContent.content, { shouldDirty: true });
    
    if (importedContent.tags && importedContent.tags.length > 0) {
      setValue('tags', importedContent.tags.join(', '), { shouldDirty: true });
    }
    
    // Hide import area after successful import
    setShowImportArea(false);
  };

  const handleClearImage = () => {
    setSelectedImageUrl('');
    setValue('image_url', '', { shouldDirty: true });
  };

  const handleFormSubmit = async (data: any) => {
    // Convert tags string to array
    const tagsArray = data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];
    
    await onSubmit({
      ...data,
      image_url: selectedImageUrl || data.image_url,
      tags: tagsArray
    });
  };

  // Debug logs to help diagnose the import area issue
  console.log('BlogForm: showImportArea state:', showImportArea);
  console.log('BlogForm: initialData prop:', initialData);

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* HTML Import Section - Only show for new posts */}
        {showImportArea && (
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary-600">Import from HTML File</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImportArea(false)}
                className="flex items-center"
              >
                <X size={16} className="mr-1" />
                Manual Entry
              </Button>
            </div>
            <BlogImportArea onContentImported={handleContentImported} />
          </div>
        )}

        {/* Show manual entry option if import area is hidden */}
        {!showImportArea && !initialData && (
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImportArea(true)}
              className="flex items-center mx-auto"
            >
              <Image size={16} className="mr-2" />
              Import from HTML File
            </Button>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-primary-600">
            Blog Post Title
          </label>
          <input
            id="title"
            {...register('title', { required: 'Title is required' })}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message as string}</p>
          )}
        </div>

        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-primary-600">
            Summary
          </label>
          <textarea
            id="summary"
            {...register('summary', { required: 'Summary is required' })}
            rows={3}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
          />
          {errors.summary && (
            <p className="mt-1 text-sm text-red-600">{errors.summary.message as string}</p>
          )}
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-primary-600">
            Blog Post Content (HTML)
          </label>
          <textarea
            id="content"
            {...register('content', { required: 'Content is required' })}
            rows={10}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
            placeholder="You can use HTML tags like <p>, <strong>, <em>, etc."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message as string}</p>
          )}
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-primary-600">
            Featured Image
          </label>
          <div className="mt-1 space-y-3">
            {/* Image URL Input with Media Manager Button */}
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
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
                placeholder="https://example.com/image.jpg or use Media Manager"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMediaManager(true)}
                className="flex items-center px-3"
              >
                <Image size={16} className="mr-1" />
                Browse
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

            {/* Image Preview */}
            {selectedImageUrl && (
              <div className="mt-3">
                <p className="text-sm font-medium text-neutral-700 mb-2">Preview:</p>
                <div className="relative inline-block">
                  <img
                    src={selectedImageUrl}
                    alt="Article preview"
                    className="w-48 h-32 object-cover rounded-lg border border-neutral-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-neutral-500">
              You can paste an image URL directly or use the Media Manager to upload/select images.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-primary-600">
            Content Type
          </label>
          <select
            id="category"
            {...register('category', { required: 'Category is required' })}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
          >
            <option value="">Select content type</option>
            <option value="news">Lodge News</option>
            <option value="blog">Blog Post</option>
            <option value="snippet">Weekly Snippet</option>
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message as string}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            Choose the type of content you're creating
          </p>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-primary-600">
            Topics/Tags (comma-separated)
          </label>
          <input
            id="tags"
            {...register('tags')}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
            placeholder="e.g., charity, masonic-education, general"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Add topic tags to help categorize your content (optional)
          </p>
        </div>

        <div>
          <label htmlFor="publish_date" className="block text-sm font-medium text-primary-600">
            Publish Date
          </label>
          <input
            id="publish_date"
            type="date"
            {...register('publish_date', { required: 'Publish date is required' })}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
          />
          {errors.publish_date && (
            <p className="mt-1 text-sm text-red-600">{errors.publish_date.message as string}</p>
          )}
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <input
              id="is_members_only"
              type="checkbox"
              {...register('is_members_only')}
              className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-neutral-300 rounded"
            />
            <label htmlFor="is_members_only" className="ml-2 block text-sm text-neutral-700">
              Members Only Post
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="is_published"
              type="checkbox"
              {...register('is_published')}
              className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-neutral-300 rounded"
            />
            <label htmlFor="is_published" className="ml-2 block text-sm text-neutral-700">
              Published
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Blog Post'}
          </Button>
        </div>
      </form>

      {/* Media Manager Modal */}
      <MediaManager
        isOpen={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        onSelectMedia={handleMediaSelect}
      />
    </>
  );
};

export default BlogForm;