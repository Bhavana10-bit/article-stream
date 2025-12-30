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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    // GET - List all or get single article
    if (req.method === 'GET') {
      if (id) {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create article
    if (req.method === 'POST') {
      const body = await req.json();
      
      const { data, error } = await supabase
        .from('articles')
        .insert({
          title: body.title,
          original_content: body.original_content,
          source_url: body.source_url,
          author: body.author,
          published_at: body.published_at,
          status: 'scraped',
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT - Update article
    if (req.method === 'PUT') {
      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      
      const { data, error } = await supabase
        .from('articles')
        .update({
          title: body.title,
          original_content: body.original_content,
          enhanced_content: body.enhanced_content,
          source_url: body.source_url,
          author: body.author,
          published_at: body.published_at,
          reference_urls: body.reference_urls,
          status: body.status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete article
    if (req.method === 'DELETE') {
      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Article deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in articles-crud:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
