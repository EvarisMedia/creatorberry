import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TrainingItem {
  id: string;
  category: string;
  subcategory: string | null;
  title: string;
  content: string;
  source_file: string | null;
  chunk_index: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTrainingItemInput {
  category: string;
  subcategory?: string;
  title: string;
  content: string;
  source_file?: string;
}

export interface UpdateTrainingItemInput {
  id: string;
  category?: string;
  subcategory?: string;
  title?: string;
  content?: string;
  is_active?: boolean;
}

export function useTrainingLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trainingItems, isLoading, error } = useQuery({
    queryKey: ["training-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_library")
        .select("*")
        .order("category", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TrainingItem[];
    },
  });

  const createItem = useMutation({
    mutationFn: async (input: CreateTrainingItemInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // First create the item
      const { data, error } = await supabase
        .from("training_library")
        .insert({
          category: input.category,
          subcategory: input.subcategory || null,
          title: input.title,
          content: input.content,
          source_file: input.source_file || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate embedding in background (don't block)
      supabase.functions.invoke("generate-embedding", {
        body: { text: `${input.title} ${input.content}` },
      }).then(async ({ data: embeddingData }) => {
        if (embeddingData?.embedding) {
          // Update the item with the embedding
          await supabase
            .from("training_library")
            .update({ content_embedding: JSON.stringify(embeddingData.embedding) })
            .eq("id", data.id);
          console.log("Embedding generated for training item:", data.id);
        }
      }).catch(err => {
        console.error("Failed to generate embedding:", err);
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-library"] });
      toast({
        title: "Training item added",
        description: "The training item has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding training item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateItem = useMutation({
    mutationFn: async (input: UpdateTrainingItemInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from("training_library")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-library"] });
      toast({
        title: "Training item updated",
        description: "The training item has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating training item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_library")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-library"] });
      toast({
        title: "Training item deleted",
        description: "The training item has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting training item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("training_library")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["training-library"] });
      toast({
        title: data.is_active ? "Item activated" : "Item deactivated",
        description: `The training item is now ${data.is_active ? "active" : "inactive"}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error toggling item status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("training-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("training-documents")
        .getPublicUrl(fileName);

      // Call edge function to process the document
      const { data, error } = await supabase.functions.invoke("process-training-document", {
        body: {
          fileName,
          filePath: uploadData.path,
          fileType: file.type,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["training-library"] });
      toast({
        title: "Document processed",
        description: `Extracted ${data?.itemsCreated || 0} training items from the document.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error processing document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateEmbeddings = useMutation({
    mutationFn: async () => {
      // Get items without embeddings
      const { data: items, error: fetchError } = await supabase
        .from("training_library")
        .select("id, title, content")
        .is("content_embedding", null);

      if (fetchError) throw fetchError;
      if (!items || items.length === 0) {
        return { processed: 0 };
      }

      let processed = 0;
      for (const item of items) {
        try {
          const { data: embeddingData } = await supabase.functions.invoke("generate-embedding", {
            body: { text: `${item.title} ${item.content}` },
          });

          if (embeddingData?.embedding) {
            await supabase
              .from("training_library")
              .update({ content_embedding: JSON.stringify(embeddingData.embedding) })
              .eq("id", item.id);
            processed++;
          }
        } catch (err) {
          console.error(`Failed to generate embedding for item ${item.id}:`, err);
        }
      }

      return { processed, total: items.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["training-library"] });
      toast({
        title: "Embeddings regenerated",
        description: `Generated embeddings for ${data.processed} of ${data.total || 0} items.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error regenerating embeddings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Count items missing embeddings
  const itemsMissingEmbeddings = useQuery({
    queryKey: ["training-library-missing-embeddings"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("training_library")
        .select("*", { count: "exact", head: true })
        .is("content_embedding", null);

      if (error) throw error;
      return count || 0;
    },
  });

  // Group items by category
  const itemsByCategory = trainingItems?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, TrainingItem[]>) || {};

  return {
    trainingItems,
    itemsByCategory,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
    toggleActive,
    uploadDocument,
    regenerateEmbeddings,
    itemsMissingEmbeddings: itemsMissingEmbeddings.data || 0,
  };
}
