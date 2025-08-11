import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CMSNewsArticle } from '../../types';
import Button from '../Button';
import MediaManager from './MediaManager';
import { Image, X } from 'lucide-react';

interface NewsFormProps {
  onSubmit: (data: Omit<CMSNewsArticle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CMSNewsArticle>;
}

const NewsForm: React.FC<NewsFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(initialData?.image_url || '');

  const { register, handleSubmit, setValue, watch, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: initialData?.title || '',
      summary: initialData?.summary || '',
      content: initialData?.content || '',
      image_url: initialData?.image_url || '',
      publish_date: initialData?.publish_date || new Date().toISOString().split('T')[0],
      is_members_only: initialData?.is_members_only || false,
      is_published: initialData?.is_published !== undefined ? initialData.is_published : true
    }
  });

  const watchedImageUrl = watch('image_url');

  // Rich text editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'blockquote'],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'blockquote', 'align'
  ];

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

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-primary-600">
          Article Title
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
        <label className="block text-sm font-medium text-primary-600 mb-2">
          Article Content
        </label>
        <Controller
          name="content"
          control={control}
          rules={{ required: 'Content is required' }}
          render={({ field }) => (
            <div className="border border-neutral-300 rounded-md overflow-hidden">
              <ReactQuill
                theme="snow"
                value={field.value}
                onChange={field.onChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your article content here..."
                style={{ minHeight: '200px' }}
              />
            </div>
          )}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content.message as string}</p>
        )}
        <p className="mt-1 text-xs text-neutral-500">
          Use the toolbar above to format your content. The editor will automatically generate clean HTML.
        </p>
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
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500 min-w-0"
              placeholder="https://example.com/image.jpg or use Media Manager"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMediaManager(true)}
              className="flex items-center px-4 py-2 whitespace-nowrap bg-secondary-50 hover:bg-secondary-100 border-secondary-300 font-medium"
            >
              <Image size={16} className="mr-2" />
              Browse Images
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
            Members Only Article
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
        <Button type="submit" disabled={isSubmitting || !watch('content')?.trim()}>
          {isSubmitting ? 'Saving...' : 'Save Article'}
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

export default NewsForm;