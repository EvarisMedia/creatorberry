import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { PinsList } from "@/components/pins/PinsList";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Pins() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { brands, isLoading: brandsLoading } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (brands.length > 0 && !selectedBrandId) {
      setSelectedBrandId(brands[0].id);
    }
  }, [brands, selectedBrandId]);

  if (authLoading || brandsLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) return null;

  const selectedBrand = brands.find((b) => b.id === selectedBrandId);

  if (brands.length === 0) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-xl font-semibold mb-2">No brands yet</h2>
          <p className="text-muted-foreground mb-4">
            Create a brand first to start generating pins
          </p>
          <Button onClick={() => navigate("/create-brand")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Brand
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Pins</h1>
        </div>
        {brands.length > 1 && (
          <Select value={selectedBrandId || ""} onValueChange={setSelectedBrandId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedBrand && <PinsList brand={selectedBrand} />}
    </div>
  );
}
