import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePlans, Plan, PlanFeatures, CreatePlanInput } from "@/hooks/usePlans";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_FEATURES: PlanFeatures = {
  max_products: 3,
  max_outlines: 5,
  max_exports: 10,
  max_images: 20,
  copilot: false,
  sales_pages: false,
  kdp: false,
  launch_toolkit: false,
  ai_text_models: false,
  ai_image_models: false,
};

export default function AdminPlans() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { plans, isLoading, createPlan, updatePlan, deletePlan } = usePlans();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<PlanFeatures>(DEFAULT_FEATURES);

  // Get user counts per plan
  const { data: userCounts } = useQuery({
    queryKey: ["plan-user-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("plan_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data as any[]).forEach((p) => {
        if (p.plan_id) counts[p.plan_id] = (counts[p.plan_id] || 0) + 1;
      });
      return counts;
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    navigate("/dashboard");
    return null;
  }

  const openCreate = () => {
    setEditingPlan(null);
    setName("");
    setPrice("");
    setDescription("");
    setFeatures(DEFAULT_FEATURES);
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(String(plan.price));
    setDescription(plan.description || "");
    setFeatures(plan.features);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload: CreatePlanInput = {
      name,
      price: Number(price),
      description: description || undefined,
      features,
    };

    if (editingPlan) {
      await updatePlan.mutateAsync({ id: editingPlan.id, ...payload });
    } else {
      await createPlan.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleDeactivate = async () => {
    if (deactivateId) {
      await deletePlan.mutateAsync(deactivateId);
      setDeactivateId(null);
    }
  };

  const updateFeature = (key: keyof PlanFeatures, value: number | boolean) => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  };

  const FeatureBool = ({ label, featureKey }: { label: string; featureKey: keyof PlanFeatures }) => (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch
        checked={features[featureKey] as boolean}
        onCheckedChange={(v) => updateFeature(featureKey, v)}
      />
    </div>
  );

  const FeatureNum = ({ label, featureKey }: { label: string; featureKey: keyof PlanFeatures }) => (
    <div className="flex items-center justify-between gap-4">
      <Label>{label}</Label>
      <Input
        type="number"
        className="w-24"
        value={features[featureKey] as number}
        onChange={(e) => updateFeature(featureKey, Number(e.target.value))}
      />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Plan Management</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage pricing plans with feature limits
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans?.map((plan) => (
              <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <CardDescription>${plan.price} one-time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}

                  <div className="text-sm space-y-1">
                    <p>Products: {plan.features.max_products === -1 ? "∞" : plan.features.max_products}</p>
                    <p>Outlines: {plan.features.max_outlines === -1 ? "∞" : plan.features.max_outlines}</p>
                    <p>Exports: {plan.features.max_exports === -1 ? "∞" : plan.features.max_exports}</p>
                    <p>Images: {plan.features.max_images === -1 ? "∞" : plan.features.max_images}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {plan.features.copilot && <Badge variant="outline">Copilot</Badge>}
                      {plan.features.sales_pages && <Badge variant="outline">Sales Pages</Badge>}
                      {plan.features.kdp && <Badge variant="outline">KDP</Badge>}
                      {plan.features.launch_toolkit && <Badge variant="outline">Launch Toolkit</Badge>}
                      {plan.features.ai_text_models && <Badge variant="outline">AI Text</Badge>}
                      {plan.features.ai_image_models && <Badge variant="outline">AI Images</Badge>}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {userCounts?.[plan.id] || 0} users on this plan
                  </p>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {plan.is_active && (
                      <Button size="sm" variant="outline" onClick={() => setDeactivateId(plan.id)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Deactivate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Update plan details and feature limits." : "Define a new pricing plan."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pro" />
            </div>
            <div>
              <Label>Price (one-time, $)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="149" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <p className="font-medium text-sm">Limits (-1 = unlimited)</p>
              <FeatureNum label="Max Products" featureKey="max_products" />
              <FeatureNum label="Max Outlines" featureKey="max_outlines" />
              <FeatureNum label="Max Exports" featureKey="max_exports" />
              <FeatureNum label="Max Images" featureKey="max_images" />
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <p className="font-medium text-sm">Module Access</p>
              <FeatureBool label="AI Copilot" featureKey="copilot" />
              <FeatureBool label="Sales Pages" featureKey="sales_pages" />
              <FeatureBool label="KDP Publisher" featureKey="kdp" />
              <FeatureBool label="Launch Toolkit" featureKey="launch_toolkit" />
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <p className="font-medium text-sm">AI Access</p>
              <FeatureBool label="AI Text Models" featureKey="ai_text_models" />
              <FeatureBool label="AI Image Models" featureKey="ai_image_models" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name || !price || createPlan.isPending || updatePlan.isPending}>
              {(createPlan.isPending || updatePlan.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPlan ? "Save Changes" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateId} onOpenChange={(open) => !open && setDeactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This plan will be hidden from new assignments but existing users won't be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
