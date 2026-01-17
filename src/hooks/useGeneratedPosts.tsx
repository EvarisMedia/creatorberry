import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type PostType = 
  | "educational_breakdown"
  | "opinion_contrarian"
  | "founder_story"
  | "case_study"
  | "framework_post"
  | "trend_reaction"
  | "lesson_learned"
  | "how_to_tactical"
  | "myth_busting"
  | "future_prediction"
  | "listicle"
  | "quick_tip";

export type PostStatus = "draft" | "edited" | "approved" | "scheduled" | "published";
export type PostLength = "short" | "medium" | "long";

export type MediaFormat = 
  | "text_only"
  | "with_image"
  | "carousel"
  | "poll"
  | "article";

export interface CarouselSlide {
  slideNumber: number;
  headline: string;
  content: string;
  visualSuggestion?: string;
}

export interface GeneratedPost {
  id: string;
  brand_id: string;
  source_id: string | null;
  user_id: string;
  post_type: PostType;
  hook: string;
  body: string;
  cta: string | null;
  full_content: string;
  post_length: PostLength;
  status: PostStatus;
  source_context: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  media_format?: MediaFormat;
  carousel_slides?: CarouselSlide[];
}

export interface GeneratePostsInput {
  brand: {
    id: string;
    name: string;
    tone: string | null;
    writing_style: string | null;
    emoji_usage: string | null;
    about: string | null;
    core_beliefs: string | null;
    opinions: string | null;
    signature_frameworks: string | null;
    target_audience: string | null;
    offers_services: string | null;
  };
  source?: {
    id: string;
    name: string;
    source_type: string;
    url: string | null;
    content: string | null;
    topic: string | null;
    funnel_stage: string;
  };
  postType: PostType;
  postTypes?: PostType[]; // For mixed type generation
  postLength: PostLength;
  numberOfPosts: number;
  mediaFormat?: MediaFormat;
  generateMixedTypes?: boolean;
  persistToDrafts?: boolean; // Save drafts server-side
}

export function useGeneratedPosts(brandId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ["generated-posts", brandId],
    queryFn: async () => {
      if (!brandId) return [];

      const { data, error } = await supabase
        .from("generated_posts")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Parse carousel_slides from JSON if present
      return (data || []).map(post => ({
        ...post,
        carousel_slides: Array.isArray(post.carousel_slides) 
          ? (post.carousel_slides as unknown as CarouselSlide[]) 
          : undefined,
      })) as GeneratedPost[];
    },
    enabled: !!brandId && !!user,
  });

  const generatePosts = useMutation({
    mutationFn: async (input: GeneratePostsInput) => {
      const { data, error } = await supabase.functions.invoke("generate-posts", {
        body: input,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      // Invalidate posts query to refresh the list after server-side persistence
      queryClient.invalidateQueries({ queryKey: ["generated-posts", brandId] });
    },
  });

  const savePost = useMutation({
    mutationFn: async (post: {
      brand_id: string;
      source_id?: string;
      post_type: PostType;
      hook: string;
      body: string;
      cta?: string;
      post_length: PostLength;
      source_context?: string;
      media_format?: MediaFormat;
      carousel_slides?: CarouselSlide[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      const fullContent = `${post.hook}\n\n${post.body}${post.cta ? `\n\n${post.cta}` : ""}`;

      const { data, error } = await supabase
        .from("generated_posts")
        .insert({
          ...post,
          user_id: user.id,
          full_content: fullContent,
          status: "draft",
          carousel_slides: post.carousel_slides || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-posts", brandId] });
      toast.success("Post saved to drafts");
    },
    onError: (error) => {
      toast.error("Failed to save post: " + error.message);
    },
  });

  const updatePostStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PostStatus }) => {
      const { data, error } = await supabase
        .from("generated_posts")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-posts", brandId] });
    },
  });

  const schedulePost = useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: Date }) => {
      const { data, error } = await supabase
        .from("generated_posts")
        .update({ 
          scheduled_at: scheduledAt.toISOString(),
          status: "scheduled" as PostStatus 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-posts", brandId] });
      toast.success("Post scheduled successfully");
    },
    onError: (error) => {
      toast.error("Failed to schedule post: " + error.message);
    },
  });

  const unschedulePost = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("generated_posts")
        .update({ 
          scheduled_at: null,
          status: "draft" as PostStatus 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-posts", brandId] });
      toast.success("Post unscheduled");
    },
    onError: (error) => {
      toast.error("Failed to unschedule post: " + error.message);
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({
      id,
      hook,
      body,
      cta,
    }: {
      id: string;
      hook: string;
      body: string;
      cta?: string;
    }) => {
      const fullContent = `${hook}\n\n${body}${cta ? `\n\n${cta}` : ""}`;

      const { data, error } = await supabase
        .from("generated_posts")
        .update({ hook, body, cta, full_content: fullContent, status: "edited" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-posts", brandId] });
      toast.success("Post updated");
    },
    onError: (error) => {
      toast.error("Failed to update post: " + error.message);
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("generated_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-posts", brandId] });
      toast.success("Post deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete post: " + error.message);
    },
  });

  const markAsPublished = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("generated_posts")
        .update({
          status: "published" as PostStatus,
          published_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-posts", brandId] });
      toast.success("Post marked as published!");
    },
    onError: (error) => {
      toast.error("Failed to mark post as published: " + error.message);
    },
  });

  return {
    posts: postsQuery.data || [],
    isLoading: postsQuery.isLoading,
    error: postsQuery.error,
    generatePosts,
    savePost,
    updatePostStatus,
    updatePost,
    deletePost,
    schedulePost,
    unschedulePost,
    markAsPublished,
  };
}
