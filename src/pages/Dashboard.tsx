import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrands } from "@/hooks/useBrands";
import { useProductIdeas } from "@/hooks/useProductIdeas";
import { useProductOutlines } from "@/hooks/useProductOutlines";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Plus,
  Lightbulb,
  FileText,
  Sparkles,
  Palette,
  Download,
} from "lucide-react";

const Dashboard = () => {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const { brands, currentBrand, isLoading: brandsLoading } = useBrands();
  const { ideas } = useProductIdeas(currentBrand?.id || null);
  const { outlines } = useProductOutlines(currentBrand?.id || null);

  const totalIdeas = ideas.length;
  const topIdeas = ideas
    .filter((i) => i.pmf_score)
    .sort((a, b) => (b.pmf_score?.combined_score || 0) - (a.pmf_score?.combined_score || 0))
    .slice(0, 3);
  const totalOutlines = outlines.length;

  return (
    <AppLayout
      title="Dashboard"
      subtitle={`Welcome back`}
      headerActions={
        <Link to="/product-ideas">
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Ideas
          </Button>
        </Link>
      }
    >
      <div className="p-6">
        {/* No Brands CTA */}
        {!brandsLoading && brands.length === 0 && (
          <Card className="mb-8 overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your First Brand</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Set up your brand profile to start generating validated product ideas and outlines.
              </p>
              <Link to="/channels/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Brand
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide font-medium">Product Ideas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalIdeas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide font-medium">Outlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalOutlines}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide font-medium">Brands</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{brands.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {currentBrand && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Link to="/product-ideas">
              <Card className="cursor-pointer group hover:shadow-lg transition-all">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all">
                    <Lightbulb className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Generate Ideas</CardTitle>
                    <CardDescription>AI-powered product ideas with PMF scoring</CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/outlines">
              <Card className="cursor-pointer group hover:shadow-lg transition-all">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all">
                    <FileText className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Create Outline</CardTitle>
                    <CardDescription>Structure your product with AI</CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/export-center">
              <Card className="cursor-pointer group hover:shadow-lg transition-all">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all">
                    <Download className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Export Center</CardTitle>
                    <CardDescription>Export your products in any format</CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/image-studio">
              <Card className="cursor-pointer group hover:shadow-lg transition-all">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all">
                    <Palette className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Image Studio</CardTitle>
                    <CardDescription>Generate book covers, illustrations & more</CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Top Product Ideas */}
        {topIdeas.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Product Ideas</CardTitle>
                <CardDescription>Highest PMF-scoring ideas</CardDescription>
              </div>
              <Link to="/product-ideas">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {topIdeas.map((idea, i) => (
                <div key={idea.id} className={`p-4 flex items-center gap-4 ${i < topIdeas.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {idea.pmf_score?.combined_score || 0}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{idea.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{idea.description}</div>
                  </div>
                  <span className="text-xs bg-secondary px-2 py-1 rounded">{idea.format}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Getting Started */}
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Complete these steps to create your first digital product</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Link
              to="/channels/new"
              className={`block p-4 border-b border-border hover:bg-accent/50 transition-colors ${brands.length > 0 ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm ${brands.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {brands.length > 0 ? "✓" : "1"}
                </div>
                <div>
                  <div className="font-medium">Set up your brand profile</div>
                  <div className="text-sm text-muted-foreground">Define your niche, audience, and voice</div>
                </div>
              </div>
            </Link>
            <Link to="/product-ideas" className={`block p-4 border-b border-border hover:bg-accent/50 transition-colors ${totalIdeas > 0 ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm ${totalIdeas > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {totalIdeas > 0 ? "✓" : "2"}
                </div>
                <div>
                  <div className="font-medium">Generate product ideas</div>
                  <div className="text-sm text-muted-foreground">AI-powered ideas with PMF scoring</div>
                </div>
              </div>
            </Link>
            <Link to="/outlines" className={`block p-4 border-b border-border hover:bg-accent/50 transition-colors ${totalOutlines > 0 ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm ${totalOutlines > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {totalOutlines > 0 ? "✓" : "3"}
                </div>
                <div>
                  <div className="font-medium">Build your first outline</div>
                  <div className="text-sm text-muted-foreground">Structure your product with sections</div>
                </div>
              </div>
            </Link>
            <Link to="/export-center" className="block p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-medium text-sm bg-muted text-muted-foreground">4</div>
                <div>
                  <div className="font-medium">Export your product</div>
                  <div className="text-sm text-muted-foreground">Download as PDF, ePub, DOCX, and more</div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* CopilotChat removed - needs brand prop */}
    </AppLayout>
  );
};

export default Dashboard;
