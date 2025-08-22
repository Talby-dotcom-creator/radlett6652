import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Tag, ArrowRight, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import SectionHeading from '../components/SectionHeading';
import NewsCard from '../components/NewsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { optimizedApi as cmsApi } from '../lib/optimizedApi';
import { CMSBlogPost, BlogItem } from '../types';

const BlogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [blogPosts, setBlogPosts] = useState<CMSBlogPost[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<CMSBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { key: 'all', label: 'All Posts', count: 0 },
    { key: 'charity', label: 'Charity Work', count: 0 },
    { key: 'masonic-education', label: 'Masonic Education', count: 0 },
  ];

  useEffect(() => {
    const loadBlogPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const blogData = await cmsApi.getBlogPosts();
        const publishedBlogPosts = blogData.filter(post => post.is_published);
        setBlogPosts(publishedBlogPosts);
        
        // Set the most recent article as featured
        if (publishedBlogPosts.length > 0) {
          setFeaturedArticle(publishedBlogPosts[0]);
        }
      } catch (err) {
        console.error('Error loading blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
        setBlogPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadBlogPosts();
  }, []);

  // Convert CMS blog post to component format
  const convertBlogPostData = (cmsBlogPost: CMSBlogPost): BlogItem => ({
    id: cmsBlogPost.id,
    title: cmsBlogPost.title,
    date: new Date(cmsBlogPost.publish_date),
    summary: cmsBlogPost.summary,
    content: cmsBlogPost.content,
    image: cmsBlogPost.image_url,
    isMembers: cmsBlogPost.is_members_only
  });
  
  // Filter blog posts based on search term and category
  const filteredBlogPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         post.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           (Array.isArray(post.tags) && post.tags.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase())));
    return matchesSearch && matchesCategory;
  });
  
  // Sort by date (newest first)
  const sortedBlogPosts = [...filteredBlogPosts].sort((a, b) => 
    new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
  );

  // Get recent articles (excluding featured)
  const recentArticles = sortedBlogPosts.filter(article => article.id !== featuredArticle?.id).slice(0, 6);

  return (
    <>
      {/* Enhanced Blog Header */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          {/* Main Header Content */}
          <div className="pt-32 pb-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Blog Title with Enhanced Typography */}
              <div className="mb-6">
                <div className="mb-6">
  <img
    src="/LODGE PIC copy copy.png"
    alt="Radlett Lodge No. 6652 Logo"
    className="w-28 h-28 md:w-32 md:h-32 mx-auto object-contain drop-shadow-2xl"
    onError={(e) => {
      e.currentTarget.style.display = 'none';
      // Show fallback icon
      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
      if (fallback) fallback.style.display = 'flex';
    }}
                  />
                  {/* Fallback icon */}
                  <div className="w-28 h-28 md:w-32 md:h-32 mx-auto bg-secondary-500 rounded-full items-center justify-center hidden drop-shadow-2xl">
                    <BookOpen className="w-14 h-14 md:w-16 md:h-16 text-primary-800" />
                  </div>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-4 leading-tight">
                  Lodge
                  <span className="block text-secondary-500 text-4xl md:text-5xl lg:text-6xl mt-2">
                    Chronicles
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-neutral-100 max-w-2xl mx-auto leading-relaxed">
                  Stories, insights, and updates from the heart of Radlett Lodge No. 6652
                </p>
              </div>

              {/* Enhanced Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-6 w-6 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search articles, topics, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg bg-white bg-opacity-95 backdrop-blur-sm border-0 rounded-xl shadow-lg focus:ring-4 focus:ring-secondary-500 focus:ring-opacity-50 focus:outline-none text-neutral-800 placeholder-neutral-500 transition-all duration-300"
                  />
                  {searchTerm && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Navigation */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category.key
                        ? 'bg-secondary-500 text-primary-800 shadow-lg transform scale-105'
                        : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 hover:scale-105'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
                  <div className="flex items-center justify-center mb-3">
                    <BookOpen className="w-8 h-8 text-secondary-500" />
                  </div>
                  <div className="text-2xl font-bold text-secondary-500 mb-1">{blogPosts.length}</div>
                  <div className="text-sm text-neutral-200">Published Articles</div>
                </div>
                
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
                  <div className="flex items-center justify-center mb-3">
                    <Calendar className="w-8 h-8 text-secondary-500" />
                  </div>
                  <div className="text-2xl font-bold text-secondary-500 mb-1">Weekly</div>
                  <div className="text-sm text-neutral-200">New Content</div>
                </div>
                
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
                  <div className="flex items-center justify-center mb-3">
                    <TrendingUp className="w-8 h-8 text-secondary-500" />
                  </div>
                  <div className="text-2xl font-bold text-secondary-500 mb-1">76+</div>
                  <div className="text-sm text-neutral-200">Years of Stories</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 text-white" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </section>

      {/* Featured Article Section */}
      {featuredArticle && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <SectionHeading 
                  title="Featured Article" 
                  subtitle="Our latest and most important updates"
                />
                <div className="flex items-center text-secondary-500 text-sm font-medium">
                  <Clock size={16} className="mr-2" />
                  Latest Update
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {featuredArticle.image_url && (
                    <div className="relative h-64 lg:h-auto">
                      <img 
                        src={featuredArticle.image_url} 
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  )}
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center mb-4">
                      <span className="bg-secondary-500 text-primary-800 text-xs font-bold px-3 py-1 rounded-full">
                        FEATURED
                      </span>
                      <span className="text-neutral-500 text-sm ml-4">
                        {new Date(featuredArticle.publish_date).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-heading font-bold text-primary-600 mb-4 leading-tight">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-neutral-600 text-lg mb-6 leading-relaxed">
                      {featuredArticle.summary}
                    </p>
                    <Link to={`/news/${featuredArticle.id}`}>
                      <Button className="inline-flex items-center">
                        Read Full Article
                        <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Articles Grid */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <SectionHeading 
              title="Recent Articles" 
              subtitle="Stay updated with the latest news and insights from our Lodge"
              centered
            />
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            {loading ? (
              <LoadingSpinner subtle={true} className="py-8" />
            ) : recentArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recentArticles.map(post => (
                  <NewsCard key={post.id} news={convertBlogPostData(post)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                <h3 className="text-xl font-semibold text-neutral-600 mb-2">No Articles Found</h3>
                <p className="text-neutral-500 max-w-md mx-auto">
                  {searchTerm 
                    ? `No articles match your search "${searchTerm}". Try different keywords.`
                    : 'No articles are available at this time. Check back soon for new content!'
                  }
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}

            {/* Load More Button */}
            {recentArticles.length >= 6 && (
              <div className="text-center mt-12">
                <Link to="/blog">
                  <Button variant="outline" size="lg" className="inline-flex items-center">
                    View All Articles
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter Subscription CTA */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-500 rounded-full mb-6">
              <User className="w-8 h-8 text-primary-800" />
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Stay Connected with Our Lodge
            </h2>
            <p className="text-xl text-neutral-100 mb-8 max-w-2xl mx-auto">
              Get the latest updates, event announcements, and insights delivered directly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link to="/contact" className="flex-1">
                <Button variant="primary" size="lg" className="w-full">
                  Get Updates
                </Button>
              </Link>
              <Link to="/about" className="flex-1">
                <Button variant="outline" size="lg" className="w-full border-white text-white hover:bg-white hover:text-primary-600">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogPage;