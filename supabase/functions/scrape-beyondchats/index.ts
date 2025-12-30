import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    console.log('Starting to scrape BeyondChats blog...');

    // First, map the blog section to find all blog URLs
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://beyondchats.com/blog',
        limit: 100,
        includeSubdomains: false,
      }),
    });

    const mapData = await mapResponse.json();
    
    if (!mapData.success || !mapData.links) {
      console.error('Failed to map blog:', mapData);
      throw new Error('Failed to map BeyondChats blog');
    }

    // Filter blog article URLs (exclude pagination, tags, etc.)
    const blogUrls = mapData.links.filter((url: string) => 
      url.includes('/blog/') && 
      !url.includes('/page/') && 
      !url.includes('/tag/') &&
      !url.includes('/category/') &&
      url !== 'https://beyondchats.com/blog/' &&
      url !== 'https://beyondchats.com/blog'
    );

    console.log(`Found ${blogUrls.length} blog articles`);

    // Get the last page of articles (last 5 articles)
    const lastPageUrls = blogUrls.slice(-5);
    console.log('Scraping last page articles:', lastPageUrls);

    const articles = [];

    for (const url of lastPageUrls) {
      console.log(`Scraping: ${url}`);
      
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });

      const scrapeData = await scrapeResponse.json();

      if (scrapeData.success && scrapeData.data) {
        const metadata = scrapeData.data.metadata || {};
        
        articles.push({
          title: metadata.title || 'Untitled',
          original_content: scrapeData.data.markdown || '',
          source_url: url,
          author: metadata.author || null,
          published_at: metadata.publishedTime || null,
          status: 'scraped',
        });
        
        console.log(`Scraped: ${metadata.title}`);
      } else {
        console.error(`Failed to scrape ${url}:`, scrapeData);
      }
    }

    // Insert articles into database
    if (articles.length > 0) {
      const { data, error } = await supabase
        .from('articles')
        .insert(articles)
        .select();

      if (error) {
        console.error('Failed to insert articles:', error);
        throw error;
      }

      console.log(`Inserted ${data.length} articles into database`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Scraped and stored ${data.length} articles`,
          articles: data 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'No articles found to scrape', articles: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-beyondchats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
