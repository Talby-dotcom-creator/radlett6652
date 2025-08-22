import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { marked } from 'marked';
import Button from '../Button';

interface BlogImportAreaProps {
  onContentImported: (content: {
    title: string;
    summary: string;
    content: string;
    tags?: string[];
  }) => void;
  className?: string;
}

interface ImportResult {
  success: boolean;
  title?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  error?: string;
}

const BlogImportArea: React.FC<BlogImportAreaProps> = ({ onContentImported, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseMarkdownContent = (markdownContent: string): ImportResult => {
    try {
      // Convert Markdown to HTML
      const htmlContent = marked(markdownContent);
      
      // Extract title from first H1 in markdown
      const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Extract summary from first paragraph (after title)
      const lines = markdownContent.split('\n').filter(line => line.trim());
      let summary = '';
      
      // Find first paragraph that's not a heading
      for (const line of lines) {
        if (!line.startsWith('#') && line.trim().length > 0) {
          summary = line.trim().substring(0, 200);
          if (line.length > 200) summary += '...';
          break;
        }
      }
      
      // Extract tags from markdown metadata (if present)
      const tagsMatch = markdownContent.match(/^tags:\s*(.+)$/m);
      let tags: string[] = [];
      if (tagsMatch) {
        tags = tagsMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }

      return {
        success: true,
        title: title || 'Untitled Blog Post',
        summary: summary || 'No summary available',
        content: htmlContent,
        tags
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  const parseHTMLContent = (htmlContent: string): ImportResult => {
    try {
      // Create a temporary DOM element to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Extract title - try multiple sources
      let title = '';
      const h1 = doc.querySelector('h1');
      const titleTag = doc.querySelector('title');
      const metaTitle = doc.querySelector('meta[property="og:title"]') || doc.querySelector('meta[name="title"]');
      
      if (h1?.textContent) {
        title = h1.textContent.trim();
      } else if (titleTag?.textContent) {
        title = titleTag.textContent.trim();
      } else if (metaTitle?.getAttribute('content')) {
        title = metaTitle.getAttribute('content')!.trim();
      }

      // Extract summary - try multiple sources
      let summary = '';
      const metaDescription = doc.querySelector('meta[name="description"]') || doc.querySelector('meta[property="og:description"]');
      const firstP = doc.querySelector('p');
      
      if (metaDescription?.getAttribute('content')) {
        summary = metaDescription.getAttribute('content')!.trim();
      } else if (firstP?.textContent) {
        summary = firstP.textContent.trim().substring(0, 200) + (firstP.textContent.length > 200 ? '...' : '');
      }

      // Extract main content - get body content or everything if no body
      let content = '';
      const body = doc.querySelector('body');
      const main = doc.querySelector('main') || doc.querySelector('article');
      
      if (main) {
        content = main.innerHTML.trim();
      } else if (body) {
        content = body.innerHTML.trim();
      } else {
        // If no body tag, use the entire HTML but clean it up
        content = htmlContent.trim();
      }

      // Clean up the content - remove script tags, style tags, etc.
      const contentDoc = parser.parseFromString(`<div>${content}</div>`, 'text/html');
      const scripts = contentDoc.querySelectorAll('script, style, link[rel="stylesheet"]');
      scripts.forEach(el => el.remove());
      content = contentDoc.querySelector('div')?.innerHTML || content;

      // Extract tags from meta keywords
      let tags: string[] = [];
      const metaKeywords = doc.querySelector('meta[name="keywords"]');
      if (metaKeywords?.getAttribute('content')) {
        tags = metaKeywords.getAttribute('content')!
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }

      // Validate that we got meaningful content
      if (!title && !content) {
        return {
          success: false,
          error: 'Could not extract meaningful content from the HTML file. Please ensure it contains proper HTML structure.'
        };
      }

      return {
        success: true,
        title: title || 'Untitled Blog Post',
        summary: summary || 'No summary available',
        content,
        tags
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse HTML: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setLastImport(null);

    try {
      const fileName = file.name.toLowerCase();
      
      // Check if it's a Markdown file
      const isMarkdown = fileName.endsWith('.md') || fileName.endsWith('.markdown');
      const isHTML = fileName.endsWith('.html') || fileName.endsWith('.htm');
      
      if (!isMarkdown && !isHTML) {
        throw new Error('Please select a Markdown (.md) or HTML (.html) file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size is 5MB.');
      }

      // Read file content
      const content = await file.text();
      
      // Parse the content based on file type
      const result = isMarkdown ? parseMarkdownContent(content) : parseHTMLContent(content);
      setLastImport(result);

      if (result.success && result.title && result.content) {
        // Call the callback with the extracted content
        onContentImported({
          title: result.title,
          summary: result.summary || '',
          content: result.content,
          tags: result.tags
        });
      }

    } catch (error) {
      setLastImport({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process file'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const clearLastImport = () => {
    setLastImport(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-secondary-500 bg-secondary-50 shadow-lg'
            : isProcessing
            ? 'border-neutral-300 bg-neutral-50'
            : 'border-secondary-300 hover:border-secondary-400 hover:bg-secondary-50 shadow-sm'
        } ${isProcessing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,.md,.markdown"
          onChange={handleFileSelect}
          disabled={isProcessing}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          {isProcessing ? (
            <>
              <div className="w-12 h-12 border-2 border-secondary-200 border-t-secondary-500 rounded-full animate-spin mb-4"></div>
              <p className="text-neutral-600 font-medium">Processing file...</p>
              <p className="text-sm text-neutral-500 mt-1">Extracting content and formatting</p>
            </>
          ) : (
            <>
              <Upload className={`w-12 h-12 mb-4 ${isDragOver ? 'text-secondary-500' : 'text-neutral-400'}`} />
              <p className={`mb-2 font-medium ${isDragOver ? 'text-secondary-600' : 'text-neutral-600'}`}>
                {isDragOver ? 'Drop your file here' : 'Import Blog Post Content'}
              </p>
              <p className="text-sm text-neutral-500 mb-4">
                Drag and drop a Markdown or HTML file here, or click to browse
              </p>
              <div className="flex items-center space-x-4 text-xs text-neutral-500">
                <span>• Supports .md, .markdown, .html, .htm files</span>
                <span>• Maximum size: 5MB</span>
                <span>• Auto-extracts title, summary, and content</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Import Result */}
      {lastImport && (
        <div className={`rounded-lg p-4 border ${
          lastImport.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              {lastImport.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-grow">
                <h4 className={`font-medium mb-1 ${
                  lastImport.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {lastImport.success ? 'Content Imported Successfully!' : 'Import Failed'}
                </h4>
                
                {lastImport.success ? (
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Title:</strong> {lastImport.title}</p>
                    <p><strong>Summary:</strong> {lastImport.summary?.substring(0, 100)}...</p>
                    {lastImport.tags && lastImport.tags.length > 0 && (
                      <p><strong>Tags:</strong> {lastImport.tags.join(', ')}</p>
                    )}
                    <p className="text-xs mt-2">
                      Content has been populated in the form below. You can review and edit before publishing.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-700">{lastImport.error}</p>
                )}
              </div>
            </div>
            <button
              onClick={clearLastImport}
              className="ml-2 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
              title="Clear result"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <FileText className="w-4 h-4 mr-2" />
          Import Tips
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Markdown files (.md):</strong></p>
          <p>• Title will be extracted from the first # heading</p>
          <p>• Summary will be extracted from the first paragraph</p>
          <p>• Content will be automatically converted to HTML</p>
          <p>• Use standard Markdown syntax for formatting</p>
          
          <p className="mt-3"><strong>HTML files (.html):</strong></p>
          <p>• Title extracted from &lt;h1&gt; or &lt;title&gt; tags</p>
          <p>• Summary from meta description or first paragraph</p>
          <p>• All HTML formatting preserved</p>
          
          <p className="text-xs mt-2 text-blue-600">
            You can edit all fields after import before publishing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlogImportArea;