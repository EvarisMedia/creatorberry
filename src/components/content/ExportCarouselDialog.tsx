import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Download, FileImage, Loader2, AlertCircle, CheckCircle, Image as ImageIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import type { CarouselSlide } from "./CarouselSlidesEditor";

interface ExportCarouselDialogProps {
  slides: CarouselSlide[];
  brand: {
    id?: string;
    name: string;
    primary_color?: string | null;
    secondary_color?: string | null;
  };
  postId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportStyle = 'infographic' | 'slide_deck' | 'quote_card';

interface GeneratedImage {
  slideNumber: number;
  imageUrl: string;
}

interface CarouselJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_slides: number;
  completed_slides: number;
  generated_images: GeneratedImage[];
  error: string | null;
}

export function ExportCarouselDialog({ slides, brand, postId, open, onOpenChange }: ExportCarouselDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [style, setStyle] = useState<ExportStyle>('infographic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Cleanup subscription on unmount or dialog close
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Check for existing carousel images for this post when dialog opens
  useEffect(() => {
    if (!open) return;

    const checkExistingImages = async () => {
      setIsLoadingExisting(true);
      try {
        // Check for existing carousel images linked to this post (only if postId is provided)
        if (postId) {
          const { data: existingImages, error: imgError } = await supabase
            .from('generated_images')
            .select('*')
            .eq('post_id', postId)
            .eq('image_type', 'carousel_slide')
            .order('created_at', { ascending: true });

          if (imgError) {
            console.error('Error fetching existing images:', imgError);
          } else if (existingImages && existingImages.length > 0) {
            console.log(`Found ${existingImages.length} existing carousel images for post ${postId}`);
            // Map to GeneratedImage format
            const mapped: GeneratedImage[] = existingImages.map((img, index) => ({
              slideNumber: index + 1,
              imageUrl: img.image_url,
            }));
            setGeneratedImages(mapped);
          }
        }
      } catch (err) {
        console.error('Error checking existing images:', err);
      } finally {
        setIsLoadingExisting(false);
      }
    };

    checkExistingImages();
  }, [open, postId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setJobId(null);
      setIsGenerating(false);
      setCurrentSlide(0);
      setError(null);
      setGeneratedImages([]);
    }
  }, [open]);

  // Polling fallback for job status (in case realtime fails)
  useEffect(() => {
    if (!jobId || !isGenerating) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data: job, error } = await supabase
          .from('carousel_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('Polling error:', error);
          return;
        }

        if (job) {
          console.log(`Poll: status=${job.status}, completed=${job.completed_slides}/${job.total_slides}`);
          
          setCurrentSlide(job.completed_slides);
          
          // Normalize the generated_images array
          const normalizedImages: GeneratedImage[] = ((job.generated_images as any[]) || []).map((img: any) => ({
            slideNumber: img.slideNumber ?? img.slide_number ?? 0,
            imageUrl: img.imageUrl ?? img.image_url ?? '',
          }));
          
          const validImages = normalizedImages.filter(img => img.imageUrl && img.slideNumber > 0);
          if (validImages.length > generatedImages.length) {
            setGeneratedImages(validImages);
          }

          // Check if complete - either status says completed OR all slides are done
          if (job.status === 'completed' || 
              (job.completed_slides === job.total_slides && validImages.length > 0)) {
            setIsGenerating(false);
            setGeneratedImages(validImages);
            if (validImages.length === job.total_slides) {
              toast.success('All carousel images generated successfully!');
            } else if (validImages.length > 0) {
              toast.warning(`Generated ${validImages.length} of ${job.total_slides} images`);
            }
            clearInterval(pollInterval);
          } else if (job.status === 'failed') {
            setIsGenerating(false);
            setError(job.error || 'Generation failed');
            toast.error(job.error || 'Failed to generate carousel images');
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Polling exception:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, isGenerating, generatedImages.length]);

  const subscribeToJob = (jobId: string) => {
    console.log(`Subscribing to job updates: ${jobId}`);
    
    // Remove existing channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`carousel-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'carousel_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          const job = payload.new as CarouselJob;
          console.log(`Job update received:`, job.status, job.completed_slides, '/', job.total_slides);
          
          setCurrentSlide(job.completed_slides);
          
          // Normalize the generated_images array
          const normalizedImages: GeneratedImage[] = (job.generated_images || []).map((img: any) => ({
            slideNumber: img.slideNumber ?? img.slide_number ?? 0,
            imageUrl: img.imageUrl ?? img.image_url ?? '',
          }));
          
          const validImages = normalizedImages.filter(img => img.imageUrl && img.slideNumber > 0);
          setGeneratedImages(validImages);

          if (job.status === 'completed') {
            setIsGenerating(false);
            if (validImages.length === job.total_slides) {
              toast.success('All carousel images generated successfully!');
            } else {
              toast.warning(`Generated ${validImages.length} of ${job.total_slides} images`);
            }
            // Cleanup subscription
            supabase.removeChannel(channel);
            channelRef.current = null;
          } else if (job.status === 'failed') {
            setIsGenerating(false);
            setError(job.error || 'Generation failed');
            toast.error(job.error || 'Failed to generate carousel images');
            // Cleanup subscription
            supabase.removeChannel(channel);
            channelRef.current = null;
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for job ${jobId}:`, status);
      });

    channelRef.current = channel;
  };

  const handleGenerate = async () => {
    if (!brand.id) {
      toast.error('Brand ID is required');
      return;
    }

    setIsGenerating(true);
    setCurrentSlide(0);
    setGeneratedImages([]);
    setError(null);
    setJobId(null);

    try {
      console.log('Starting carousel generation with background job pattern...');
      
      const { data, error: fnError } = await supabase.functions.invoke('generate-carousel-images', {
        body: {
          slides: slides.map((s, i) => ({ ...s, slideNumber: i + 1 })),
          brand: {
            id: brand.id,
            name: brand.name,
            primary_color: brand.primary_color,
            secondary_color: brand.secondary_color,
          },
          style,
          postId,
        },
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        throw new Error(fnError.message || 'Failed to start generation');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.jobId) {
        console.log('Job created:', data.jobId);
        setJobId(data.jobId);
        subscribeToJob(data.jobId);
        toast.info(`Generating ${slides.length} carousel images in the background...`);
      } else {
        throw new Error('No job ID returned');
      }
    } catch (err) {
      console.error('Error starting carousel generation:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate images');
      toast.error('Failed to start carousel generation');
      setIsGenerating(false);
    }
  };

  const handleGoToLibrary = () => {
    onOpenChange(false);
    navigate('/images');
  };

  // Helper to convert URL to base64 for PDF
  const urlToBase64 = async (url: string): Promise<string | null> => {
    try {
      if (url.startsWith('data:')) {
        return url;
      }
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    if (generatedImages.length === 0) return;

    try {
      toast.info('Creating PDF...');
      
      // Create PDF with 4:5 aspect ratio pages (1080x1350)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [1080, 1350],
      });

      for (let i = 0; i < generatedImages.length; i++) {
        const img = generatedImages[i];
        
        if (i > 0) {
          pdf.addPage([1080, 1350]);
        }

        // Convert to base64 if needed and add to PDF
        const base64Url = await urlToBase64(img.imageUrl);
        if (base64Url) {
          pdf.addImage(base64Url, 'PNG', 0, 0, 1080, 1350);
        }
      }

      // Download the PDF
      pdf.save(`${brand.name.replace(/\s+/g, '_')}_carousel.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error creating PDF:', err);
      toast.error('Failed to create PDF');
    }
  };

  const handleDownloadImages = async () => {
    if (generatedImages.length === 0) return;

    let downloadedCount = 0;
    for (const img of generatedImages) {
      if (!img.imageUrl) continue;
      
      try {
        // For remote URLs, fetch and convert to blob URL for download
        let downloadUrl = img.imageUrl;
        if (!img.imageUrl.startsWith('data:')) {
          const response = await fetch(img.imageUrl);
          const blob = await response.blob();
          downloadUrl = URL.createObjectURL(blob);
        }
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${brand.name.replace(/\s+/g, '_')}_slide_${img.slideNumber}.png`;
        link.click();
        
        // Clean up blob URL if we created one
        if (!img.imageUrl.startsWith('data:')) {
          URL.revokeObjectURL(downloadUrl);
        }
        downloadedCount++;
      } catch (err) {
        console.error(`Failed to download slide ${img.slideNumber}:`, err);
      }
    }

    toast.success(`Downloaded ${downloadedCount} images`);
  };

  const progress = isGenerating ? (currentSlide / slides.length) * 100 : 0;
  const hasImages = generatedImages.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Export Carousel as Images
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Style Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Style:</label>
            <Select value={style} onValueChange={(v) => setStyle(v as ExportStyle)} disabled={isGenerating}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="infographic">Infographic</SelectItem>
                <SelectItem value="slide_deck">Slide Deck</SelectItem>
                <SelectItem value="quote_card">Quote Card</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="ml-auto">
              {slides.length} slides
            </Badge>
          </div>
          
          {/* Auto-save notice */}
          <p className="text-xs text-muted-foreground">
            Images are automatically saved to your Image Library as they're generated.
          </p>

          {/* Generate Button or Progress */}
          {isLoadingExisting && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Checking for existing images...</span>
            </div>
          )}

          {!hasImages && !isGenerating && !isLoadingExisting && (
            <Button onClick={handleGenerate} className="w-full" size="lg" disabled={!brand.id}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Generate All Slide Images
            </Button>
          )}

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {currentSlide === 0 
                    ? 'Starting generation...' 
                    : `Generated ${currentSlide} of ${slides.length} slides...`}
                </span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                This may take a few minutes. Images are saved to your library automatically.
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && !hasImages && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Image Preview Grid */}
          {hasImages && (
            <ScrollArea className="flex-1 min-h-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pr-4">
                {generatedImages.map((img) => (
                  <div key={img.slideNumber} className="relative group">
                    <div className="aspect-[4/5] rounded-lg overflow-hidden border bg-muted">
                      {img.imageUrl ? (
                        <img
                          src={img.imageUrl}
                          alt={`Slide ${img.slideNumber}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error(`Failed to load image for slide ${img.slideNumber}`);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <AlertCircle className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 text-xs"
                    >
                      {img.slideNumber}
                    </Badge>
                    {img.imageUrl && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Regenerate Option */}
          {hasImages && !isGenerating && (
            <Button variant="outline" onClick={handleGenerate} size="sm">
              Regenerate All
            </Button>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-2">
          {hasImages && (
            <>
              <Button variant="secondary" onClick={handleGoToLibrary}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Image Library
              </Button>
              <Button variant="outline" onClick={handleDownloadImages}>
                <Download className="h-4 w-4 mr-2" />
                Download Images
              </Button>
              <Button onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </>
          )}
          {!hasImages && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
