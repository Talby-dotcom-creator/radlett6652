import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { optimizedApi as cmsApi } from '../lib/optimizedApi';
import { CMSBlogPost } from '../types';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blogPost, setBlogPost] = useState<CMSBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBlogPost = async () => {
      if (!id) {
        setError('No blog post ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get all blog posts and find the one with matching ID
        const blogData = await cmsApi.getNewsArticles();
        const post = blogData.find(item => item.id === id && item.is_published);
        
        if (post) {
          setBlogPost(post);
        } else {
          setError('Blog post not found or not published');
        }
      } catch (err) {
        console.error('Error loading blog post:', err);
        setError('Failed to load blog post. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadBlogPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 text-center py-12">
          <LoadingSpinner subtle={true} />
        </div>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
          <h1 className="text-3xl font-heading font-bold text-primary-600 mb-6">
            {error || 'Blog Post Not Found'}
          </h1>
          <p className="text-neutral-600 mb-8">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/blog">
            <Button>Return to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-28 pb-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <Link to="/blog" className="inline-flex items-center text-secondary-500 hover:text-secondary-600 transition-colors mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Back to Blog
        </Link>
        
        <article>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary-600 mb-4">
            {blogPost.title}
          </h1>
          
          <div className="flex items-center mb-6 text-sm text-neutral-500">
            <Calendar size={16} className="mr-1.5 text-secondary-500" />
            <span>{format(new Date(blogPost.publish_date), 'dd/MM/yyyy')}</span>
            {blogPost.is_members_only && (
              <>
                <span className="mx-2">•</span>
                <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded text-xs font-medium">
                  Members Only
                </span>
              </>
            )}
          </div>
          
          {blogPost.image_url && (
            <img
              src={blogPost.image_url}
              alt={blogPost.title}
              className="w-full h-auto object-contain rounded-lg shadow-medium mb-8 max-h-96"
            />
          )}
          
          {/* Summary */}
          <div className="bg-neutral-50 rounded-lg p-6 mb-8">
            <p className="text-lg text-neutral-700 font-medium">{blogPost.summary}</p>
          </div>
          
          {/* Content */}
          <div 
            className="prose max-w-none text-neutral-600"
            dangerouslySetInnerHTML={{ __html: blogPost.content }}
          />
          
          <div className="mt-8 pt-8 border-t border-neutral-200">
            <Link to="/blog">
              <Button variant="outline">
                View All Blog Posts
              </Button>
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
};

export default NewsDetailPage;