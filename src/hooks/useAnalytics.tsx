import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subDays, format, eachDayOfInterval } from "date-fns";

interface AnalyticsData {
  totalPosts: number;
  postsByStatus: Record<string, number>;
  postsByType: Record<string, number>;
  postsByLength: Record<string, number>;
  totalImages: number;
  totalSources: number;
  scheduledPosts: number;
  postsOverTime: { date: string; count: number }[];
  imagesOverTime: { date: string; count: number }[];
}

export function useAnalytics(brandId: string | undefined) {
  return useQuery({
    queryKey: ["analytics", brandId],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!brandId) {
        return {
          totalPosts: 0,
          postsByStatus: {},
          postsByType: {},
          postsByLength: {},
          totalImages: 0,
          totalSources: 0,
          scheduledPosts: 0,
          postsOverTime: [],
          imagesOverTime: [],
        };
      }

      const thirtyDaysAgo = subDays(new Date(), 30);
      const today = new Date();

      // Fetch posts
      const { data: posts, error: postsError } = await supabase
        .from("generated_posts")
        .select("*")
        .eq("brand_id", brandId);

      if (postsError) throw postsError;

      // Fetch images
      const { data: images, error: imagesError } = await supabase
        .from("generated_images")
        .select("*")
        .eq("brand_id", brandId);

      if (imagesError) throw imagesError;

      // Fetch sources
      const { data: sources, error: sourcesError } = await supabase
        .from("content_sources")
        .select("id")
        .eq("brand_id", brandId);

      if (sourcesError) throw sourcesError;

      // Calculate post statistics
      const postsByStatus: Record<string, number> = {};
      const postsByType: Record<string, number> = {};
      const postsByLength: Record<string, number> = {};
      let scheduledPosts = 0;

      posts?.forEach((post) => {
        // By status
        postsByStatus[post.status] = (postsByStatus[post.status] || 0) + 1;
        
        // By type
        if (post.post_type) {
          postsByType[post.post_type] = (postsByType[post.post_type] || 0) + 1;
        }
        
        // By length
        if (post.post_length) {
          postsByLength[post.post_length] = (postsByLength[post.post_length] || 0) + 1;
        }
        
        // Scheduled count
        if (post.scheduled_at) {
          scheduledPosts++;
        }
      });

      // Calculate posts over time (last 30 days)
      const dateRange = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
      const postsOverTime = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const count = posts?.filter((post) => {
          const postDate = format(new Date(post.created_at), "yyyy-MM-dd");
          return postDate === dateStr;
        }).length || 0;
        return { date: format(date, "MMM dd"), count };
      });

      // Calculate images over time (last 30 days)
      const imagesOverTime = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const count = images?.filter((image) => {
          const imageDate = format(new Date(image.created_at), "yyyy-MM-dd");
          return imageDate === dateStr;
        }).length || 0;
        return { date: format(date, "MMM dd"), count };
      });

      return {
        totalPosts: posts?.length || 0,
        postsByStatus,
        postsByType,
        postsByLength,
        totalImages: images?.length || 0,
        totalSources: sources?.length || 0,
        scheduledPosts,
        postsOverTime,
        imagesOverTime,
      };
    },
    enabled: !!brandId,
  });
}
