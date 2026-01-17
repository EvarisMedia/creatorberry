import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { BoardsList } from "@/components/boards/BoardsList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

export default function Boards() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { currentBrand, brands, isLoading: brandsLoading } = useBrands();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && profile && !profile.is_approved) {
      navigate("/pending-approval");
    }
  }, [user, profile, authLoading, navigate]);

  if (authLoading || brandsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentBrand) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-2">No Brand Selected</h2>
            <p className="text-muted-foreground mb-4">
              {brands.length === 0
                ? "Create a brand to start managing boards"
                : "Select a brand from the dashboard to manage boards"}
            </p>
            <Button onClick={() => navigate(brands.length === 0 ? "/channels/new" : "/dashboard")}>
              {brands.length === 0 ? (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Brand
                </>
              ) : (
                "Go to Dashboard"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <BoardsList brandId={currentBrand.id} />
      </div>
    </div>
  );
}
