import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CMSPageContent } from '../../types';
import Button from '../Button';
import MediaManager from './MediaManager';
import { Image, X } from 'lucide-react';

interface PageContentFormProps {
  onSubmit: (data: Omit<CMSPageContent, 'id' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CMSPageContent>;
}

const PageContentForm: React.FC<PageContentFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      page_name: initialData?.page_name || '',
      section_name: initialData?.section_name || '',
      content_type: initialData?.content_type || 'text',
      content: initialData?.content || ''
    }
  });

  const contentType = watch('content_type');
  const sectionName = watch('section_name');

  const handleMediaSelect = (url: string) => {
    setSelectedMediaUrl(url);
    setShowMediaManager(false);
  };

  const insertMediaUrl = () => {
    if (selectedMediaUrl) {
      const currentContent = watch('content');
      const newContent = contentType === 'html' 
        ? `${currentContent}<img src="${selectedMediaUrl}" alt="Image" class="w-full h-auto rounded-lg" />`
        : selectedMediaUrl; // For text content type, replace entirely with URL
      
      setValue('content', newContent, { shouldDirty: true });
      setSelectedMediaUrl('');
    }
  };

  const clearSelectedMedia = () => {
    setSelectedMediaUrl('');
  };

  // Check if this section is likely to contain an image URL
  const isImageUrlSection = sectionName && (
    sectionName.includes('image') || 
    sectionName.includes('photo') || 
    sectionName.includes('background') ||
    sectionName.includes('hero') ||
    sectionName.includes('banner')
  );

  const renderContentInput = () => {
    if (contentType === 'html') {
      return (
        <div>
          <textarea
            id="content"
            {...register('content', { required: 'Content is required' })}
            rows={12}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500 font-mono text-sm"
            placeholder="<p>Enter HTML content here...</p>"
          />
          <div className="mt-2 flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMediaManager(true)}
              className="flex items-center"
            >
              <Image size={16} className="mr-1" />
              Insert Image
            </Button>
            {selectedMediaUrl && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-600 truncate max-w-xs">
                  {selectedMediaUrl.split('/').pop()}
                </span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={insertMediaUrl}
                >
                  Insert HTML
                </Button>
                <button
                  type="button"
                  onClick={clearSelectedMedia}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (contentType === 'json') {
      return (
        <textarea
          id="content"
          {...register('content', { 
            required: 'Content is required',
            validate: (value) => {
              try {
                JSON.parse(value);
                return true;
              } catch {
                return 'Must be valid JSON';
              }
            }
          })}
          rows={8}
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500 font-mono text-sm"
          placeholder='{"key": "value"}'
        />
      );
    }

    // Text content type
    return (
      <div>
        <div className="flex space-x-2">
          <textarea
            id="content"
            {...register('content', { required: 'Content is required' })}
            rows={6}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
            placeholder="Enter text content here..."
          />
          <div className="flex flex-col space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMediaManager(true)}
              className="flex items-center whitespace-nowrap"
            >
              <Image size={16} className="mr-1" />
              Browse Media
            </Button>
            {selectedMediaUrl && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={insertMediaUrl}
                className="flex items-center whitespace-nowrap"
              >
                Use URL
              </Button>
            )}
          </div>
        </div>
        
        {/* Media Preview for text content */}
        {selectedMediaUrl && (
          <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-neutral-200 rounded-lg flex items-center justify-center overflow-hidden">
                  {selectedMediaUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                    <img 
                      src={selectedMediaUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <Image size={20} className="text-neutral-400" />
                  )}
                  <div className="w-full h-full items-center justify-center hidden">
                    <Image size={20} className="text-neutral-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700">
                    Selected Media
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {selectedMediaUrl}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelectedMedia}
                className="p-1 text-red-500 hover:text-red-700"
                title="Clear selection"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        
        {isImageUrlSection && (
          <p className="mt-1 text-xs text-blue-600 bg-blue-50 p-2 rounded">
            💡 This section appears to be for an image URL. Use "Browse Media" to select an image, then click "Use URL" to set it as the content.
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="page_name" className="block text-sm font-medium text-primary-600">
              Page Name
            </label>
            <select
              id="page_name"
              {...register('page_name', { required: 'Page name is required' })}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
            >
              <option value="">Select a page</option>
              <option value="homepage">Homepage</option>
              <option value="about">About Page</option>
              <option value="join">Join Page</option>
              <option value="contact">Contact Page</option>
              <option value="events">Events Page</option>
              <option value="news">News Page</option>
              <option value="faq">FAQ Page</option>
              <option value="privacy">Privacy Page</option>
              <option value="terms">Terms Page</option>
              <option value="members">Members Page</option>
            </select>
            {errors.page_name && (
              <p className="mt-1 text-sm text-red-600">{errors.page_name.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="section_name" className="block text-sm font-medium text-primary-600">
              Section Name
            </label>
            <input
              id="section_name"
              {...register('section_name', { required: 'Section name is required' })}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
              placeholder="e.g., hero_title, welcome_text, intro_image_url"
            />
            {errors.section_name && (
              <p className="mt-1 text-sm text-red-600">{errors.section_name.message as string}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="content_type" className="block text-sm font-medium text-primary-600">
            Content Type
          </label>
          <select
            id="content_type"
            {...register('content_type')}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
          >
            <option value="text">Plain Text</option>
            <option value="html">HTML</option>
            <option value="json">JSON</option>
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Use "text" for image URLs, "html" for rich content with images, "json" for structured data
          </p>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-primary-600">
            Content
          </label>
          {renderContentInput()}
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message as string}</p>
          )}
          {contentType === 'html' && (
            <p className="mt-1 text-xs text-neutral-500">
              You can use HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, etc. Use the "Insert Image" button to add images.
            </p>
          )}
          {contentType === 'text' && (
            <p className="mt-1 text-xs text-neutral-500">
              For image URLs, use the "Browse Media" button to select from uploaded files or paste a direct URL.
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Content'}
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

export default PageContentForm;