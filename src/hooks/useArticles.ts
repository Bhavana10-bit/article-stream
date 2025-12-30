import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi, Article } from '@/lib/api/articles';
import { useToast } from '@/hooks/use-toast';

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: articlesApi.list,
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ['articles', id],
    queryFn: () => articlesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (article: { title: string; original_content: string; source_url: string; author?: string; published_at?: string }) => 
      articlesApi.create(article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({ title: 'Success', description: 'Article created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}


export function useUpdateArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, article }: { id: string; article: Partial<Article> }) =>
      articlesApi.update(id, article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({ title: 'Success', description: 'Article updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => articlesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({ title: 'Success', description: 'Article deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useScrapeArticles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: articlesApi.scrape,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({ title: 'Success', description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useEnhanceArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (articleId: string) => articlesApi.enhance(articleId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({ title: 'Success', description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
