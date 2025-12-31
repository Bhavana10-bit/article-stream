import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/lib/api/articles';

export function useArticlesRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('articles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'articles',
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData<Article[]>(['articles'], (old) => {
              if (!old) return [payload.new as Article];
              const exists = old.some((a) => a.id === (payload.new as Article).id);
              if (exists) return old;
              return [payload.new as Article, ...old];
            });
          }
          
          if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData<Article[]>(['articles'], (old) => {
              if (!old) return old;
              return old.map((article) =>
                article.id === (payload.new as Article).id
                  ? (payload.new as Article)
                  : article
              );
            });
            // Also update single article cache
            queryClient.setQueryData<Article>(
              ['articles', (payload.new as Article).id],
              payload.new as Article
            );
          }
          
          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<Article[]>(['articles'], (old) => {
              if (!old) return old;
              return old.filter((article) => article.id !== (payload.old as Article).id);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
