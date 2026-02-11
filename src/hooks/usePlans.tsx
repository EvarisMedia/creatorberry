import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlanFeatures {
  max_products: number;
  max_outlines: number;
  max_exports: number;
  max_images: number;
  copilot: boolean;
  sales_pages: boolean;
  kdp: boolean;
  launch_toolkit: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: PlanFeatures;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanInput {
  name: string;
  price: number;
  description?: string;
  features: PlanFeatures;
  sort_order?: number;
}

export function usePlans() {
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as Plan[];
    },
  });

  const createPlan = useMutation({
    mutationFn: async (input: CreatePlanInput) => {
      const { error } = await supabase.from("plans").insert(input as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan created");
    },
    onError: () => toast.error("Failed to create plan"),
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Plan> & { id: string }) => {
      const { error } = await supabase.from("plans").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan updated");
    },
    onError: () => toast.error("Failed to update plan"),
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plans").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan deactivated");
    },
    onError: () => toast.error("Failed to deactivate plan"),
  });

  const assignPlan = useMutation({
    mutationFn: async ({ userId, planId }: { userId: string; planId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ plan_id: planId } as any)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Plan assigned");
    },
    onError: () => toast.error("Failed to assign plan"),
  });

  return { plans, isLoading, createPlan, updatePlan, deletePlan, assignPlan };
}
