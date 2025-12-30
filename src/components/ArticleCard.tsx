import { Article } from '@/lib/api/articles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Trash2, ExternalLink, Eye } from 'lucide-react';
import { useEnhanceArticle, useDeleteArticle } from '@/hooks/useArticles';

interface ArticleCardProps {
  article: Article;
  onView: (article: Article) => void;
}

const statusColors = {
  scraped: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  enhanced: 'bg-green-500/20 text-green-400 border-green-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function ArticleCard({ article, onView }: ArticleCardProps) {
  const enhanceMutation = useEnhanceArticle();
  const deleteMutation = useDeleteArticle();

  const handleEnhance = () => {
    enhanceMutation.mutate(article.id);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this article?')) {
      deleteMutation.mutate(article.id);
    }
  };

  const isProcessing = article.status === 'processing' || enhanceMutation.isPending;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              {article.author && <span>{article.author}</span>}
              {article.published_at && (
                <span className="text-muted-foreground/60">
                  {new Date(article.published_at).toLocaleDateString()}
                </span>
              )}
            </CardDescription>
          </div>
          <Badge className={statusColors[article.status]} variant="outline">
            {article.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {article.original_content.substring(0, 200)}...
        </p>
        
        {article.error_message && (
          <p className="text-sm text-destructive">{article.error_message}</p>
        )}

        {article.reference_urls && article.reference_urls.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {article.reference_urls.length} reference(s) found
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(article)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          
          {article.status === 'scraped' && (
            <Button
              size="sm"
              onClick={handleEnhance}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1" />
              )}
              Enhance
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(article.source_url, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
