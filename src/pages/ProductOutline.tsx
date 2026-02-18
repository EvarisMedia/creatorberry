import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBrands } from "@/hooks/useBrands";
import { useProductOutlines, OutlineSection } from "@/hooks/useProductOutlines";
import { useProductIdeas } from "@/hooks/useProductIdeas";
import OutlineSectionCard from "@/components/outlines/OutlineSectionCard";
import OutlineCard from "@/components/outlines/OutlineCard";
import GenerateOutlineDialog from "@/components/outlines/GenerateOutlineDialog";
import BuildAllSectionsDialog from "@/components/outlines/BuildAllSectionsDialog";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Loader2,
  FileText,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Wand2,
} from "lucide-react";

const ProductOutlinePage = () => {
  const { outlineId } = useParams();
  const { currentBrand } = useBrands();
  const { outlines, isLoading: outlinesLoading, isGenerating, generateOutline, fetchOutlineWithSections, updateSection, deleteOutline } = useProductOutlines(currentBrand?.id || null);
  const { ideas } = useProductIdeas(currentBrand?.id || null);
  const navigate = useNavigate();

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showBuildAll, setShowBuildAll] = useState(false);
  const [activeOutline, setActiveOutline] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (outlineId) {
      setLoadingDetail(true);
      fetchOutlineWithSections(outlineId).then((data) => {
        setActiveOutline(data);
        setLoadingDetail(false);
      });
    } else {
      setActiveOutline(null);
    }
  }, [outlineId]);

  const handleViewOutline = (id: string) => {
    navigate(`/outlines/${id}`);
  };

  const handleDeleteOutline = async (id: string) => {
    await deleteOutline(id);
    if (outlineId === id) navigate("/outlines");
  };

  const handleSectionUpdate = async (sectionId: string, updates: Partial<OutlineSection>) => {
    const success = await updateSection(sectionId, updates);
    if (success && activeOutline) {
      const updated = await fetchOutlineWithSections(activeOutline.id);
      setActiveOutline(updated);
    }
    return success;
  };

  return (
    <AppLayout
      title={outlineId ? activeOutline?.title || "Outline" : "Product Outlines"}
      subtitle={outlineId ? "Edit sections and structure" : "Structure your digital products"}
      headerActions={
        <>
          {outlineId && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/outlines")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Outlines
            </Button>
          )}
          {!outlineId && (
            <Button onClick={() => setShowGenerateDialog(true)} disabled={!currentBrand}>
              <Sparkles className="w-4 h-4 mr-2" /> Generate Outline
            </Button>
          )}
        </>
      }
    >
      <div className="p-6">
        {outlineId ? (
          loadingDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeOutline ? (
            <div className="max-w-3xl mx-auto space-y-3">
              <Card className="mb-6">
                <CardContent className="p-4 flex items-center gap-4">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">
                      {activeOutline.sections?.length || 0} sections · {activeOutline.total_word_count?.toLocaleString() || 0} words target
                    </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Button variant="default" size="sm" onClick={() => setShowBuildAll(true)}>
                       <Wand2 className="w-4 h-4 mr-2" /> Build All Sections
                     </Button>
                     <Badge variant="secondary">{activeOutline.status}</Badge>
                   </div>
                </CardContent>
              </Card>

              {(activeOutline.sections || []).map((section: OutlineSection, i: number) => (
                <OutlineSectionCard
                  key={section.id}
                  section={section}
                  index={i}
                  onUpdate={handleSectionUpdate}
                  outlineId={activeOutline.id}
                />
              ))}

              {(!activeOutline.sections || activeOutline.sections.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sections found for this outline.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Outline not found.</div>
          )
        ) : (
          <>
            {outlinesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : outlines.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-semibold mb-2">No outlines yet</h3>
                <p className="text-muted-foreground mb-6">
                  Generate an outline from one of your product ideas to get started.
                </p>
                <Button onClick={() => setShowGenerateDialog(true)} disabled={!currentBrand}>
                  <Sparkles className="w-4 h-4 mr-2" /> Generate Your First Outline
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {outlines.map((outline) => (
                  <OutlineCard
                    key={outline.id}
                    outline={outline}
                    onView={handleViewOutline}
                    onDelete={handleDeleteOutline}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <GenerateOutlineDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        ideas={ideas}
        brand={currentBrand}
        onGenerate={generateOutline}
        isGenerating={isGenerating}
      />

      {activeOutline?.sections && activeOutline.sections.length > 0 && currentBrand && (
        <BuildAllSectionsDialog
          open={showBuildAll}
          onOpenChange={setShowBuildAll}
          outlineId={activeOutline.id}
          sections={activeOutline.sections}
          brandId={currentBrand.id}
          brandContext={{
            name: currentBrand.name,
            tone: currentBrand.tone,
            about: currentBrand.about,
            target_audience: currentBrand.target_audience,
            writing_style: currentBrand.writing_style,
          }}
        />
      )}
    </AppLayout>
  );
};

export default ProductOutlinePage;
