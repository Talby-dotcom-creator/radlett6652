import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeading from '../components/SectionHeading';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import SEOHead from '../components/SEOHead';
import { optimizedApi as api } from '../lib/optimizedApi';
import { CMSBlogPost } from '../types';

const SnippetsPage: React.FC = () => {
  const [snippets, setSnippets] = useState<CMSBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSnippets = async () => {
      try {
        setLoading(true);
        setError(null);

        const snippetsData = await api.getSnippets();

        const now = new Date();
        const publishedSnippets = (snippetsData || [])
          .filter(
            (s) =>
              s.is_published &&
              s.publish_date &&
              new Date(s.publish_date) <= now
          )
          .sort(
            (a, b) =>
              new Date(b.publish_date).getTime() -
              new Date(a.publish_date).getTime()
          );

        setSnippets(publishedSnippets);
      } catch (err) {
        console.error('Error loading snippets:', err);
        setError('Failed to load Weekly Thoughts. Please try again later.');
        setSnippets([]);
      } finally {
        setLoading(false);
      }
    };

    loadSnippets();
  }, []);

  return (
    <>
      <SEOHead
        title="Weekly Thoughts | Radlett Lodge No. 6652"
        description="Weekly Thoughts from Radlett Lodge — short reflections designed to inspire, provoke thought, and enrich your Masonic journey."
        keywords="Freemasonry, Radlett Lodge, Weekly Thoughts, Masonic reflections, Hertfordshire Freemasons"
      />

      <section className="bg-stone-dark py-16 relative">
        <div className="absolute inset-0 bg-white bg-opacity-80"></div>
        <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
          <img
            src="/lodge-logo.png"
            alt="Radlett Lodge Logo"
            className="w-20 h-20 mx-auto mb-6 object-contain drop-shadow-md"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary-600">
            Weekly Thoughts
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mt-3">
            Short reflections from Radlett Lodge — thought-provoking messages to
            inspire your Masonic journey.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeading
            title="Masonic Reflections"
            subtitle="Thought-provoking messages published weekly"
            centered
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            {loading ? (
              <LoadingSpinner subtle={true} className="py-8" />
            ) : snippets.length > 0 ? (
              <div className="space-y-8">
                {snippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className="bg-gradient-to-r from-neutral-50 to-white rounded-xl p-8 shadow-soft border border-neutral-100 hover:shadow-medium transition-all duration-300"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-6">
                        <img
                          src="/lodge-logo.png"
                          alt="Radlett Lodge Logo"
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>

                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-heading font-semibold text-primary-600">
                            {snippet.title}
                          </h3>
                          <div className="flex items-center text-sm text-neutral-500">
                            <Calendar size={16} className="mr-2" />
                            {new Date(
                              snippet.publish_date
                            ).toLocaleDateString('en-GB')}
                          </div>
                        </div>

                        <div
                          className="prose prose-lg max-w-none text-neutral-700"
                          dangerouslySetInnerHTML={{ __html: snippet.content }}
                        />

                        {snippet.tags &&
                          Array.isArray(snippet.tags) &&
                          snippet.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {snippet.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-primary-100 text-primary-600 px-3 py-1 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                        <div className="mt-4 flex items-center text-sm text-neutral-500">
                          <Clock size={16} className="mr-2" />
                          <span>~20 second read</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <img
                  src="/lodge-logo.png"
                  alt="Radlett Lodge Logo"
                  className="w-16 h-16 mx-auto mb-4 object-contain opacity-30"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback =
                      e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div className="w-16 h-16 mx-auto mb-4 bg-neutral-200 rounded-full items-center justify-center hidden">
                  <BookOpen className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-600 mb-2">
                  No Weekly Thoughts yet
                </h3>
                <p className="text-neutral-500 max-w-md mx-auto">
                  Check back soon for new reflections from Radlett Lodge.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <img
              src="/lodge-logo.png"
              alt="Radlett Lodge Logo"
              className="w-16 h-16 mx-auto mb-6 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Explore More Content
            </h2>
            <p className="text-xl text-neutral-100 mb-8 max-w-2xl mx-auto">
              Discover our full collection of articles, news, and insights about
              Lodge life and Freemasonry.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/blog">
                <Button variant="primary" size="lg" className="min-w-[160px]">
                  Read Blog Posts
                </Button>
              </Link>
              <Link to="/news">
                <Button
                  variant="outline"
                  size="lg"
                  className="min-w-[160px] border-white text-white hover:bg-white hover:text-primary-600"
                >
                  Latest News
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SnippetsPage;
