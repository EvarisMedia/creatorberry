import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { PostType, MediaFormat } from "./useGeneratedPosts";

export interface UserSettings {
  id: string;
  user_id: string;
  // Content Generation
  default_posts_per_source: number;
  default_post_length: string;
  default_post_type: string;
  ai_creativity_level: number;
  always_include_cta: boolean;
  // Multi-type generation
  enabled_post_types: string[];
  generate_mixed_types: boolean;
  // Media format
  default_media_format: string;
  // Scheduling
  preferred_posting_times: string[];
  posts_per_week_goal: number;
  auto_schedule_approved: boolean;
  include_weekends: boolean;
  // Source Management
  rss_refresh_hours: number;
  max_items_per_fetch: number;
  auto_generate_from_rss: boolean;
  content_freshness_days: number;
  // Image Preferences
  default_image_style: string;
  default_image_type: string;
  auto_generate_images: boolean;
  // Notifications
  email_notifications: boolean;
  weekly_digest: boolean;
  scheduled_post_reminder_hours: number;
  new_source_content_alerts: boolean;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export const ALL_POST_TYPES: { value: PostType; label: string }[] = [
  { value: "educational_breakdown", label: "Educational Breakdown" },
  { value: "opinion_contrarian", label: "Opinion/Contrarian" },
  { value: "founder_story", label: "Founder Story" },
  { value: "case_study", label: "Case Study" },
  { value: "framework_post", label: "Framework" },
  { value: "trend_reaction", label: "Trend Reaction" },
  { value: "lesson_learned", label: "Lesson Learned" },
  { value: "how_to_tactical", label: "How-To/Tactical" },
  { value: "myth_busting", label: "Myth Busting" },
  { value: "future_prediction", label: "Future Prediction" },
  { value: "listicle", label: "Listicle" },
  { value: "quick_tip", label: "Quick Tip" },
];

export const ALL_MEDIA_FORMATS: { value: MediaFormat; label: string; description: string }[] = [
  { value: "text_only", label: "Feed Post", description: "Single image with caption" },
  { value: "with_image", label: "Feed Post + Image", description: "Post with a custom image" },
  { value: "carousel", label: "Carousel", description: "Swipeable multi-image post" },
  { value: "poll", label: "Reel", description: "Short-form video script" },
  { value: "article", label: "Story", description: "24-hour disappearing content" },
];

const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  default_posts_per_source: 3,
  default_post_length: 'medium',
  default_post_type: 'educational_breakdown',
  ai_creativity_level: 0.8,
  always_include_cta: true,
  enabled_post_types: [
    'educational_breakdown', 'opinion_contrarian', 'founder_story',
    'case_study', 'framework_post', 'trend_reaction', 'lesson_learned',
    'how_to_tactical', 'myth_busting', 'future_prediction', 'listicle', 'quick_tip'
  ],
  generate_mixed_types: false,
  default_media_format: 'text_only',
  preferred_posting_times: ['09:00'],
  posts_per_week_goal: 5,
  auto_schedule_approved: false,
  include_weekends: false,
  rss_refresh_hours: 24,
  max_items_per_fetch: 10,
  auto_generate_from_rss: false,
  content_freshness_days: 7,
  default_image_style: 'modern',
  default_image_type: 'quote_card',
  auto_generate_images: false,
  email_notifications: true,
  weekly_digest: true,
  scheduled_post_reminder_hours: 1,
  new_source_content_alerts: false,
};

export function useUserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default settings
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id, ...DEFAULT_SETTINGS })
          .select()
          .single();

        if (insertError) throw insertError;
        return newSettings as UserSettings;
      }

      return data as UserSettings;
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] });
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper to get a setting with fallback to default
  const getSetting = <K extends keyof typeof DEFAULT_SETTINGS>(key: K): typeof DEFAULT_SETTINGS[K] => {
    if (settings && key in settings) {
      return settings[key as keyof UserSettings] as typeof DEFAULT_SETTINGS[K];
    }
    return DEFAULT_SETTINGS[key];
  };

  return {
    settings: settings ?? { ...DEFAULT_SETTINGS, id: '', user_id: user?.id ?? '', created_at: '', updated_at: '' } as UserSettings,
    isLoading,
    error,
    updateSettings,
    getSetting,
    DEFAULT_SETTINGS,
  };
}
