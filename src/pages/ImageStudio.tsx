import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { useBrands } from "@/hooks/useBrands";
import { useGeneratedImages } from "@/hooks/useGeneratedImages";
import { ImageCard } from "@/components/images/ImageCard";
import { GenerateStudioImageDialog } from "@/components/images/GenerateStudioImageDialog";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Plus,
  Loader2,
  FileText,
  Sparkles,
  Image,
  ImagePlus,
  Palette,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const IMAGE_CATEGORIES = [
  { value: "all", label: "All Images" },
  { value: "book_cover", label: "Book Covers" },
  { value: "chapter_illustration", label: "Chapter Illustrations" },
  { value: "worksheet_bg", label: "Worksheet Backgrounds" },
  { value: "social_promo", label: "Social Promos" },
  { value: "quote_card", label: "Quote Cards" },
  { value: "visual", label: "Visuals" },
  { value: "banner", label: "Banners" },
];

const ImageStudio = () => {
  const { brands, currentBrand, isLoading: brandsLoading } = useBrands();
  const { images, isLoading: imagesLoading, fetchImages, deleteImage } = useGeneratedImages(currentBrand?.id);

  useEffect(() => {
    if (currentBrand?.id) {
      fetchImages();
    }
  }, [currentBrand?.id]);

  const getFilteredImages = (category: string) => {
    if (category === "all") return images;
    return images.filter((img) => img.image_type === category);
  };

  return (
    <AppLayout
      title="Image Studio"
      subtitle="Generate branded visuals for your digital products"
      headerActions={currentBrand ? <GenerateStudioImageDialog brand={currentBrand} onGenerated={fetchImages} /> : undefined}
    >
      <div className="p-6">
        {!brandsLoading && !currentBrand && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Palette className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Select a Brand</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create or select a brand to start generating images with your brand colors and style.
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

        {currentBrand && (
          <>
            {/* Image Type Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { type: "book_cover", icon: Image, title: "Book Cover", desc: "Professional ebook covers" },
                { type: "chapter_illustration", icon: ImagePlus, title: "Chapter Art", desc: "Section header illustrations" },
                { type: "worksheet_bg", icon: FileText, title: "Worksheet BG", desc: "Subtle background patterns" },
                { type: "social_promo", icon: Sparkles, title: "Social Promo", desc: "Product promotion graphics" },
              ].map((item) => (
                <Card key={item.type} className="group hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="p-5 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all">
                      <item.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <CardTitle className="text-sm mb-1">{item.title}</CardTitle>
                    <CardDescription className="text-xs">{item.desc}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Gallery with Tabs */}
            <Tabs defaultValue="all">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  {IMAGE_CATEGORIES.map((cat) => (
                    <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                      {cat.label}
                      {cat.value !== "all" && (
                        <span className="ml-1.5 text-muted-foreground">
                          ({getFilteredImages(cat.value).length})
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {IMAGE_CATEGORIES.map((cat) => (
                <TabsContent key={cat.value} value={cat.value}>
                  {imagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : getFilteredImages(cat.value).length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                          {cat.value === "all" ? "No images yet" : `No ${cat.label.toLowerCase()} yet`}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Generate your first {cat.value === "all" ? "image" : cat.label.toLowerCase()} using your brand style.
                        </p>
                        <GenerateStudioImageDialog brand={currentBrand} onGenerated={fetchImages} defaultType={cat.value !== "all" ? cat.value : undefined} />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {getFilteredImages(cat.value).map((image) => (
                        <ImageCard key={image.id} image={image} onDelete={deleteImage} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ImageStudio;
