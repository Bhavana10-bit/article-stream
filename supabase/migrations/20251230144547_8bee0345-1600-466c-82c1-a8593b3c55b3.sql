-- Create articles table to store scraped and enhanced content
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  original_content TEXT NOT NULL,
  enhanced_content TEXT,
  source_url TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  reference_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'scraped' CHECK (status IN ('scraped', 'processing', 'enhanced', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public read access for articles
CREATE POLICY "Anyone can view articles" 
ON public.articles 
FOR SELECT 
USING (true);

-- Public insert access (for edge functions)
CREATE POLICY "Anyone can insert articles" 
ON public.articles 
FOR INSERT 
WITH CHECK (true);

-- Public update access (for edge functions)
CREATE POLICY "Anyone can update articles" 
ON public.articles 
FOR UPDATE 
USING (true);

-- Public delete access
CREATE POLICY "Anyone can delete articles" 
ON public.articles 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for articles
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;