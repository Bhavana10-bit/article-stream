import { supabase } from '@/integrations/supabase/client';

export interface Article {
  id: string;
  title: string;
  original_content: string;
  enhanced_content: string | null;
  source_url: string;
  author: string | null;
  published_at: string | null;
  reference_urls: string[];
  status: 'scraped' | 'processing' | 'enhanced' | 'error';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const articlesApi = {
  async list(): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Article[];
  },

  async get(id: string): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Article;
  },

  async create(article: { title: string; original_content: string; source_url: string; author?: string; published_at?: string }): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: article.title,
        original_content: article.original_content,
        source_url: article.source_url,
        author: article.author || null,
        published_at: article.published_at || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Article;
  },

  async update(id: string, article: Partial<Article>): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .update(article)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Article;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async scrape(): Promise<{ success: boolean; message: string; articles?: Article[] }> {
    const { data, error } = await supabase.functions.invoke('scrape-beyondchats');

    if (error) throw error;
    return data;
  },

  async enhance(articleId: string): Promise<{ success: boolean; message: string; article?: Article }> {
    const { data, error } = await supabase.functions.invoke('enhance-article', {
      body: { articleId },
    });

    if (error) throw error;
    return data;
  },
};
