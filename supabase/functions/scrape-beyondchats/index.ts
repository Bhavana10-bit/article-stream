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

    console.log('Starting to scrape BeyondChats blogs...');

    // First, scrape the blogs page to extract links (note: it's /blogs/ not /blog/)
    const blogPageResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://beyondchats.com/blogs',
        formats: ['links', 'markdown'],
        onlyMainContent: false,
      }),
    });

    const blogPageData = await blogPageResponse.json();
    console.log('Blog page scrape response:', JSON.stringify(blogPageData).slice(0, 500));
    
    // Access links from the nested data structure
    const allLinks = blogPageData.data?.links || blogPageData.links || [];
    console.log('All links found:', allLinks.length);
    console.log('Sample links:', allLinks.slice(0, 10));

    // Filter blog article URLs - BeyondChats uses /blogs/ for individual articles too
    const blogUrls = allLinks.filter((url: string) => {
      const isBlogArticle = url.includes('/blogs/') && 
        !url.includes('/page/') && 
        !url.includes('/tag/') &&
        !url.includes('/category/') &&
        !url.includes('#') &&
        url !== 'https://beyondchats.com/blogs/' &&
        url !== 'https://beyondchats.com/blogs';
      return isBlogArticle;
    });

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
