import { useState } from 'react';
import { useArticles, useScrapeArticles } from '@/hooks/useArticles';
import { useArticlesRealtime } from '@/hooks/useArticlesRealtime';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleViewer } from '@/components/ArticleViewer';
import { Article } from '@/lib/api/articles';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { data: articles, isLoading, error } = useArticles();
  const scrapeMutation = useScrapeArticles();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  
  // Enable realtime updates
  useArticlesRealtime();

  const handleViewArticle = (article: Article) => {
    setSelectedArticle(article);
    setViewerOpen(true);
  };

  const handleScrape = () => {
    scrapeMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <FileText className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Article Enhancer
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Scrape articles from BeyondChats blog, search for related content, and enhance them using AI with proper citations.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center mb-8">
          <Button
            size="lg"
            onClick={handleScrape}
            disabled={scrapeMutation.isPending}
            className="gap-2"
          >
            {scrapeMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scraping BeyondChats...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Scrape BeyondChats Blog
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load articles: {error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && articles?.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-muted/20">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground mb-6">
              Click the button above to scrape articles from BeyondChats blog
            </p>
          </div>
        )}

        {/* Articles Grid */}
        {!isLoading && articles && articles.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onView={handleViewArticle}
              />
            ))}
          </div>
        )}

        {/* Article Viewer Dialog */}
        <ArticleViewer
          article={selectedArticle}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      </div>
    </div>
  );
};

export default Index;
