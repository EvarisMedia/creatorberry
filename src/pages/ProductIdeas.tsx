import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBrands } from "@/hooks/useBrands";
import { useProductIdeas, ProductIdea } from "@/hooks/useProductIdeas";
import { useProductOutlines } from "@/hooks/useProductOutlines";
import { ProductIdeaCard } from "@/components/product-ideas/ProductIdeaCard";
import { GenerateIdeasDialog } from "@/components/product-ideas/GenerateIdeasDialog";
import { AddIdeaDialog } from "@/components/product-ideas/AddIdeaDialog";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Plus,
  Loader2,
  Sparkles,
  Lightbulb,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProductIdeas = () => {
  const { brands, currentBrand, isLoading: brandsLoading } = useBrands();
  const { ideas, isLoading: ideasLoading, isGenerating, generateIdeas, createIdea, updateIdeaStatus, deleteIdea } = useProductIdeas(currentBrand?.id || null);
  const { generateOutline, isGenerating: isGeneratingOutline } = useProductOutlines(currentBrand?.id || null);
  const navigate = useNavigate();
  const [buildingIdeaId, setBuildingIdeaId] = useState<string | null>(null);

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  const handleGenerate = async (numberOfIdeas: number, seedPrompt?: string) => {
    if (!currentBrand) return;
    await generateIdeas(currentBrand, numberOfIdeas, seedPrompt);
  };

  const handleStartBuilding = async (idea: ProductIdea) => {
    if (!currentBrand) return;
    setBuildingIdeaId(idea.id);
    updateIdeaStatus(idea.id, "in_progress");
    const result = await generateOutline(idea, currentBrand);
    setBuildingIdeaId(null);
    if (result) {
      navigate("/outlines");
    }
  };

  const handleAddIdea = async (idea: { title: string; description: string; format: string; target_audience: string }) => {
    setIsAdding(true);
    await createIdea(idea);
    setIsAdding(false);
  };

  const filteredIdeas = ideas
    .filter((idea) => statusFilter === "all" || idea.status === statusFilter)
    .filter((idea) => formatFilter === "all" || idea.format === formatFilter)
    .sort((a, b) => {
      if (sortBy === "score") {
        return (b.pmf_score?.combined_score || 0) - (a.pmf_score?.combined_score || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const uniqueFormats = [...new Set(ideas.map((i) => i.format))];

  return (
    <AppLayout
      title="Product Ideas"
      subtitle="Generate and validate digital product ideas with PMF scoring"
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAddDialogOpen(true)} disabled={!currentBrand}>
            <Plus className="w-4 h-4 mr-2" />
            Add Manually
          </Button>
          <Button onClick={() => setGenerateDialogOpen(true)} disabled={!currentBrand || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ideas
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="p-6">
        {/* No Brand State */}
        {!brandsLoading && brands.length === 0 && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Create a Brand First</h3>
              <p className="text-muted-foreground mb-4">You need a brand profile before generating product ideas.</p>
              <Link to="/channels/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Brand
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {ideas.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="saved">Saved</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                {uniqueFormats.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Highest PMF Score</SelectItem>
                <SelectItem value="date">Most Recent</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="outline" className="ml-auto">
              {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}

        {/* Ideas Grid */}
        {ideasLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredIdeas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIdeas.map((idea) => (
              <ProductIdeaCard
                key={idea.id}
                idea={idea}
                onStatusChange={updateIdeaStatus}
                onDelete={deleteIdea}
                onStartBuilding={handleStartBuilding}
                isBuildingId={buildingIdeaId}
              />
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Lightbulb className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-xl font-semibold mb-2">No Product Ideas Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Generate AI-powered product ideas based on your brand profile and content sources. Each idea comes with a Product-Market Fit score.
              </p>
              <Button onClick={() => setGenerateDialogOpen(true)} disabled={!currentBrand}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Your First Ideas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No ideas match your filters.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <GenerateIdeasDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
      <AddIdeaDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddIdea}
        isAdding={isAdding}
      />
    </AppLayout>
  );
};

export default ProductIdeas;
