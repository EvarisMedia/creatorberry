import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface VoiceProfile {
  id: string;
  user_id: string;
  brand_id: string;
  name: string;
  sentence_structure: string | null;
  vocabulary_style: string | null;
  humor_style: string | null;
  transition_phrases: string[] | null;
  signature_expressions: string[] | null;
  analyzed_transcripts: number;
  voice_dna: Json | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AudiencePersona {
  id: string;
  user_id: string;
  brand_id: string;
  name: string;
  avatar_url: string | null;
  age_range: string | null;
  location: string | null;
  interests: string[] | null;
  pain_points: string[] | null;
  desires: string[] | null;
  content_habits: string | null;
  preferred_video_length: string | null;
  preferred_format: string | null;
  psychographics: Json | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export function useVoiceProfiles(brandId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["voice-profiles", brandId],
    queryFn: async () => {
      if (!brandId || !user) return [];
      
      const { data, error } = await supabase
        .from("voice_profiles")
        .select("*")
        .eq("brand_id", brandId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VoiceProfile[];
    },
    enabled: !!brandId && !!user,
  });

  const createProfile = useMutation({
    mutationFn: async (profile: { name: string }) => {
      if (!user || !brandId) throw new Error("No user or brand");
      
      const { data, error } = await supabase
        .from("voice_profiles")
        .insert({
          name: profile.name,
          user_id: user.id,
          brand_id: brandId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-profiles", brandId] });
      toast.success("Voice profile created!");
    },
    onError: (error) => {
      toast.error("Failed to create profile: " + error.message);
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, name, sentence_structure, vocabulary_style, humor_style }: { id: string; name?: string; sentence_structure?: string; vocabulary_style?: string; humor_style?: string }) => {
      const { data, error } = await supabase
        .from("voice_profiles")
        .update({ name, sentence_structure, vocabulary_style, humor_style })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-profiles", brandId] });
      toast.success("Voice profile updated!");
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    },
  });

  return {
    profiles,
    isLoading,
    createProfile,
    updateProfile,
  };
}

export function useAudiencePersonas(brandId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: personas = [], isLoading } = useQuery({
    queryKey: ["audience-personas", brandId],
    queryFn: async () => {
      if (!brandId || !user) return [];
      
      const { data, error } = await supabase
        .from("audience_personas")
        .select("*")
        .eq("brand_id", brandId)
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      return data as AudiencePersona[];
    },
    enabled: !!brandId && !!user,
  });

  const createPersona = useMutation({
    mutationFn: async (persona: { name: string; age_range?: string; location?: string }) => {
      if (!user || !brandId) throw new Error("No user or brand");
      
      const { data, error } = await supabase
        .from("audience_personas")
        .insert({
          name: persona.name,
          age_range: persona.age_range,
          location: persona.location,
          user_id: user.id,
          brand_id: brandId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audience-personas", brandId] });
      toast.success("Persona created!");
    },
    onError: (error) => {
      toast.error("Failed to create persona: " + error.message);
    },
  });

  const updatePersona = useMutation({
    mutationFn: async ({ id, name, age_range, location }: { id: string; name?: string; age_range?: string; location?: string }) => {
      const { data, error } = await supabase
        .from("audience_personas")
        .update({ name, age_range, location })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audience-personas", brandId] });
      toast.success("Persona updated!");
    },
    onError: (error) => {
      toast.error("Failed to update persona: " + error.message);
    },
  });

  const deletePersona = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("audience_personas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audience-personas", brandId] });
      toast.success("Persona deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete persona: " + error.message);
    },
  });

  return {
    personas,
    isLoading,
    createPersona,
    updatePersona,
    deletePersona,
  };
}

export function useVoiceAndPersonas(brandId: string | undefined) {
  const { profiles: voiceProfiles, isLoading: voiceLoading, createProfile, updateProfile } = useVoiceProfiles(brandId);
  const { personas, isLoading: personasLoading, createPersona, updatePersona, deletePersona } = useAudiencePersonas(brandId);
  
  return {
    voiceProfiles,
    personas,
    isLoading: voiceLoading || personasLoading,
    createProfile,
    updateProfile,
    createPersona,
    updatePersona,
    deletePersona,
  };
}
