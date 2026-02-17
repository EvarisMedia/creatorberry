import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Brand } from "./useBrands";
import { useToast } from "./use-toast";

export interface GeneratedImage {
  id: string;
  user_id: string;
  brand_id: string;
  post_id: string | null;
  image_url: string;
  prompt: string;
  image_type: string;
  quote_text: string | null;
  style: string;
  created_at: string;
  updated_at: string;
}

interface GenerateImageParams {
  brand: Brand;
  quote_text?: string;
  style: string;
  image_type: string;
  post_id?: string;
  section_id?: string;
  aspect_ratio?: string;
  custom_prompt?: string;
  custom_context?: string;
}

export function useGeneratedImages(brandId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchImages = async () => {
    if (!user || !brandId) {
      setImages([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("generated_images")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Error",
        description: "Failed to load images",
        variant: "destructive",
      });
    } else {
      setImages(data as GeneratedImage[]);
    }
    setIsLoading(false);
  };

  const generateImage = async (params: GenerateImageParams): Promise<GeneratedImage | null> => {
    if (!user) return null;

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-image", {
        body: {
          brand: {
            name: params.brand.name,
            primary_color: params.brand.primary_color,
            secondary_color: params.brand.secondary_color,
            tone: params.brand.tone,
          },
          quote_text: params.quote_text,
          style: params.style,
          image_type: params.image_type,
          ...(params.aspect_ratio ? { aspect_ratio: params.aspect_ratio } : {}),
          ...(params.custom_prompt ? { custom_prompt: params.custom_prompt } : {}),
          ...(params.custom_context ? { custom_context: params.custom_context } : {}),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { image_url, prompt } = response.data;

      // Save to database
      const { data: savedImage, error: saveError } = await supabase
        .from("generated_images")
        .insert({
          user_id: user.id,
          brand_id: params.brand.id,
          post_id: params.post_id || null,
          image_url,
          prompt,
          image_type: params.image_type,
          quote_text: params.quote_text || null,
          style: params.style,
          section_id: params.section_id || null,
        } as any)
        .select()
        .single();

      if (saveError) {
        console.error("Error saving image:", saveError);
        toast({
          title: "Warning",
          description: "Image generated but failed to save to library",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Image generated successfully!",
      });

      setImages((prev) => [savedImage as GeneratedImage, ...prev]);
      return savedImage as GeneratedImage;
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    const { error } = await supabase
      .from("generated_images")
      .delete()
      .eq("id", imageId);

    if (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
      return false;
    }

    setImages((prev) => prev.filter((img) => img.id !== imageId));
    toast({
      title: "Deleted",
      description: "Image removed from library",
    });
    return true;
  };

  const attachToPost = async (postId: string, imageId: string | null) => {
    // First, detach any existing image from this post
    const { error: detachError } = await supabase
      .from("generated_images")
      .update({ post_id: null })
      .eq("post_id", postId);

    if (detachError) {
      console.error("Error detaching image:", detachError);
      toast({
        title: "Error",
        description: "Failed to update image attachment",
        variant: "destructive",
      });
      return false;
    }

    // If imageId is provided, attach that image to the post
    if (imageId) {
      const { error: attachError } = await supabase
        .from("generated_images")
        .update({ post_id: postId })
        .eq("id", imageId);

      if (attachError) {
        console.error("Error attaching image:", attachError);
        toast({
          title: "Error",
          description: "Failed to attach image to post",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Image attached to post",
      });
    } else {
      toast({
        title: "Success",
        description: "Image detached from post",
      });
    }

    // Refresh images
    await fetchImages();
    return true;
  };

  const getImageForPost = (postId: string): GeneratedImage | undefined => {
    return images.find((img) => img.post_id === postId);
  };

  const getImagesForSection = (sectionId: string): GeneratedImage[] => {
    return images.filter((img) => (img as any).section_id === sectionId);
  };

  const fetchImagesForSection = async (sectionId: string): Promise<GeneratedImage[]> => {
    if (!user) return [];
    const { data, error } = await (supabase
      .from("generated_images")
      .select("*") as any)
      .eq("section_id", sectionId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching section images:", error);
      return [];
    }
    return (data || []) as GeneratedImage[];
  };

  return {
    images,
    isLoading,
    isGenerating,
    fetchImages,
    generateImage,
    deleteImage,
    attachToPost,
    getImageForPost,
    getImagesForSection,
    fetchImagesForSection,
  };
}
