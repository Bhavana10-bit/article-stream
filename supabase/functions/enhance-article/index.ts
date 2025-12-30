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
    const { articleId } = await req.json();

    if (!articleId) {
      return new Response(
        JSON.stringify({ success: false, error: 'articleId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!firecrawlApiKey || !lovableApiKey) {
      throw new Error('Required API keys not configured');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Fetch the article
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (fetchError || !article) {
      throw new Error('Article not found');
    }

    console.log(`Enhancing article: ${article.title}`);

    // Update status to processing
    await supabase
      .from('articles')
      .update({ status: 'processing' })
      .eq('id', articleId);

    // Step 1: Search Google for the article title using Firecrawl
    console.log('Searching Google for related articles...');
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: article.title,
        limit: 2,
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });

    const searchData = await searchResponse.json();
    console.log('Search results:', searchData);

    const referenceArticles = [];
    const referenceUrls: string[] = [];

    if (searchData.success && searchData.data) {
      for (const result of searchData.data) {
        if (result.url && result.url !== article.source_url) {
          referenceUrls.push(result.url);
          referenceArticles.push({
            url: result.url,
            title: result.title || 'Reference Article',
            content: result.markdown || result.description || '',
          });
        }
      }
    }

    console.log(`Found ${referenceArticles.length} reference articles`);

    // Step 2: Use Lovable AI to enhance the article
    console.log('Calling Lovable AI to enhance article...');
    
    const systemPrompt = `You are an expert content editor. Your task is to enhance and improve the given article by:
1. Improving clarity and readability
2. Adding depth and insights from the reference articles provided
3. Maintaining the original tone and style
4. Adding proper citations at the bottom of the article

IMPORTANT: At the end of the enhanced article, add a "References" section with properly formatted citations for each reference article used.`;

    const userPrompt = `Please enhance the following article:

ORIGINAL ARTICLE:
Title: ${article.title}
Content:
${article.original_content}

${referenceArticles.length > 0 ? `
REFERENCE ARTICLES FOR CONTEXT:
${referenceArticles.map((ref, i) => `
--- Reference ${i + 1} ---
URL: ${ref.url}
Title: ${ref.title}
Content: ${ref.content.substring(0, 2000)}
`).join('\n')}
` : 'No reference articles available.'}

Please provide the enhanced version of the article with a References section at the bottom.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Payment required. Please add credits to your workspace.');
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const enhancedContent = aiData.choices?.[0]?.message?.content;

    if (!enhancedContent) {
      throw new Error('No enhanced content generated');
    }

    console.log('Enhanced content generated successfully');

    // Step 3: Update the article with enhanced content
    const { data: updatedArticle, error: updateError } = await supabase
      .from('articles')
      .update({
        enhanced_content: enhancedContent,
        reference_urls: referenceUrls,
        status: 'enhanced',
      })
      .eq('id', articleId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Article enhanced successfully',
        article: updatedArticle 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhance-article:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Try to update article status to error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const { articleId } = await req.clone().json();
      
      if (articleId && supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('articles')
          .update({ 
            status: 'error',
            error_message: errorMessage 
          })
          .eq('id', articleId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
