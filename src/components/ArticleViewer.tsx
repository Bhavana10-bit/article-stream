import { Article } from '@/lib/api/articles';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink } from 'lucide-react';

interface ArticleViewerProps {
  article: Article | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticleViewer({ article, open, onOpenChange }: ArticleViewerProps) {
  if (!article) return null;

  const hasEnhanced = !!article.enhanced_content;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl pr-8">{article.title}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {article.author && <span>By {article.author}</span>}
            {article.published_at && (
              <span>• {new Date(article.published_at).toLocaleDateString()}</span>
            )}
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline ml-auto"
            >
              Source <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </DialogHeader>

        <Tabs defaultValue={hasEnhanced ? 'enhanced' : 'original'} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="original">Original</TabsTrigger>
            <TabsTrigger value="enhanced" disabled={!hasEnhanced}>
              Enhanced {!hasEnhanced && '(Not yet)'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="original" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[60vh] rounded-md border p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {article.original_content}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="enhanced" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[60vh] rounded-md border p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {article.enhanced_content}
              </div>
              
              {article.reference_urls && article.reference_urls.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-semibold mb-2">Reference Sources</h4>
                  <ul className="space-y-1">
                    {article.reference_urls.map((url, index) => (
                      <li key={index}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {url} <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
