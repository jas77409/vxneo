import { supabase } from '$lib/supabase';
export async function load({ params, fetch }) {
  const { slug } = params;
  
  try {
    // Fetch the specific blog post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !post) {
      return {
        status: 404,
        error: new Error('Blog post not found')
      };
    }

    // Fetch related posts (same tags)
    const { data: relatedPosts } = await supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, published_at')
      .eq('is_published', true)
      .neq('slug', slug)
      .overlaps('tags', post.tags || [])
      .limit(3)
      .order('published_at', { ascending: false });

    return {
      post,
      relatedPosts: relatedPosts || []
    };
  } catch (e) {
    return {
      status: 500,
      error: new Error('Failed to load blog post')
    };
  }
}
