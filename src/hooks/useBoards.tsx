import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Board {
  id: string;
  user_id: string;
  brand_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  keywords: string[];
  content_themes: string[];
  is_active: boolean;
  pin_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBoardData {
  brand_id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  keywords?: string[];
  content_themes?: string[];
}

export interface UpdateBoardData {
  id: string;
  name?: string;
  description?: string;
  cover_image_url?: string;
  keywords?: string[];
  content_themes?: string[];
  is_active?: boolean;
}

export function useBoards(brandId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const boardsQuery = useQuery({
    queryKey: ["boards", brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Board[];
    },
    enabled: !!brandId && !!user,
  });

  const createBoard = useMutation({
    mutationFn: async (data: CreateBoardData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: board, error } = await supabase
        .from("boards")
        .insert({
          user_id: user.id,
          brand_id: data.brand_id,
          name: data.name,
          description: data.description || null,
          cover_image_url: data.cover_image_url || null,
          keywords: data.keywords || [],
          content_themes: data.content_themes || [],
        })
        .select()
        .single();

      if (error) throw error;
      return board as Board;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", brandId] });
      toast.success("Board created successfully");
    },
    onError: (error) => {
      console.error("Error creating board:", error);
      toast.error("Failed to create board");
    },
  });

  const updateBoard = useMutation({
    mutationFn: async (data: UpdateBoardData) => {
      const { id, ...updateData } = data;
      const { data: board, error } = await supabase
        .from("boards")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return board as Board;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", brandId] });
      toast.success("Board updated successfully");
    },
    onError: (error) => {
      console.error("Error updating board:", error);
      toast.error("Failed to update board");
    },
  });

  const deleteBoard = useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase
        .from("boards")
        .delete()
        .eq("id", boardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", brandId] });
      toast.success("Board deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting board:", error);
      toast.error("Failed to delete board");
    },
  });

  const toggleBoardActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("boards")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", brandId] });
    },
    onError: (error) => {
      console.error("Error toggling board:", error);
      toast.error("Failed to update board status");
    },
  });

  return {
    boards: boardsQuery.data || [],
    isLoading: boardsQuery.isLoading,
    error: boardsQuery.error,
    createBoard,
    updateBoard,
    deleteBoard,
    toggleBoardActive,
  };
}
