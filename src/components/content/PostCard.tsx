import { useState, useEffect } from "react";
import { GeneratedPost, useGeneratedPosts, PostStatus } from "@/hooks/useGeneratedPosts";
import { useGeneratedImages, GeneratedImage } from "@/hooks/useGeneratedImages";
import { useBrands } from "@/hooks/useBrands";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MoreVertical, Trash2, Copy, Check, CheckCircle, Clock, Edit, FileText, Calendar, Image as ImageIcon, ExternalLink, Layers, FileImage } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SchedulePostDialog } from "@/components/schedule/SchedulePostDialog";
import { AttachImageDialog } from "@/components/publish/AttachImageDialog";
import { PublishPostDialog } from "@/components/publish/PublishPostDialog";
import { CarouselSlidesEditor } from "./CarouselSlidesEditor";
import { EditPostDialog } from "./EditPostDialog";
import { ExportCarouselDialog } from "./ExportCarouselDialog";

interface PostCardProps {
  post: GeneratedPost;
  brandId: string;
}

const statusConfig: Record<PostStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: FileText },
  edited: { label: "Edited", color: "bg-blue-500/10 text-blue-500", icon: Edit },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-500", icon: CheckCircle },
  scheduled: { label: "Scheduled", color: "bg-purple-500/10 text-purple-500", icon: Clock },
  published: { label: "Published", color: "bg-primary/10 text-primary", icon: Check },
};

const postTypeLabels: Record<string, string> = {
  educational_breakdown: "Educational",
  opinion_contrarian: "Hot Take",
  founder_story: "Behind the Scenes",
  case_study: "Transformation",
  framework_post: "Framework",
  trend_reaction: "Trend Reaction",
  lesson_learned: "Lesson Learned",
  how_to_tactical: "Tutorial",
  myth_busting: "Myth Busting",
  future_prediction: "Prediction",
  listicle: "Listicle",
  quick_tip: "Quick Tip",
};

const mediaFormatLabels: Record<string, string> = {
  text_only: "Caption",
  with_image: "Image",
  carousel: "Carousel",
  poll: "Reel Script",
  article: "Long Caption",
};

export function PostCard({ post, brandId }: PostCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [carouselDialogOpen, setCarouselDialogOpen] = useState(false);
  const [viewPostOpen, setViewPostOpen] = useState(false);
  const [editPostOpen, setEditPostOpen] = useState(false);
  const [exportCarouselOpen, setExportCarouselOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [attachedImage, setAttachedImage] = useState<GeneratedImage | null>(null);
  const { deletePost, updatePostStatus } = useGeneratedPosts(brandId);
  const { images, fetchImages } = useGeneratedImages(brandId);
  const { currentBrand } = useBrands();

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    // Find attached image (non-carousel)
    const image = images.find((img) => img.post_id === post.id && img.image_type !== 'carousel_slide');
    setAttachedImage(image || null);
  }, [images, post.id]);

  // Get carousel images for this post
  const carouselImages = images.filter(
    (img) => img.post_id === post.id && img.image_type === 'carousel_slide'
  );

  const hasCarouselSlides = post.carousel_slides && post.carousel_slides.length > 0;

  const StatusIcon = statusConfig[post.status].icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.full_content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    deletePost.mutate(post.id);
    setDeleteOpen(false);
  };

  const handleStatusChange = (status: PostStatus) => {
    updatePostStatus.mutate({ id: post.id, status });
  };

  const isScheduledAndDue =
    post.status === "scheduled" &&
    post.scheduled_at &&
    new Date(post.scheduled_at) < new Date();

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewPostOpen(true)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm line-clamp-2">{post.hook}</p>
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Badge variant="outline" className={`text-xs ${statusConfig[post.status].color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[post.status].label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setViewPostOpen(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditPostOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copied" : "Copy"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusChange("approved")}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Approved
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {post.body}
          </p>

          {/* Attached Image Thumbnail */}
          {attachedImage && (
            <div className="mb-3 border border-border overflow-hidden">
              <img
                src={attachedImage.image_url}
                alt="Attached"
                className="w-full h-20 object-cover"
              />
            </div>
          )}

          {/* Carousel Images Thumbnail Grid */}
          {carouselImages.length > 0 && (
            <div className="mb-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1 mb-2">
                <FileImage className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {carouselImages.length} carousel {carouselImages.length === 1 ? 'image' : 'images'} generated
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {carouselImages.slice(0, 4).map((img, index) => (
                  <div 
                    key={img.id} 
                    className="relative aspect-square border border-border overflow-hidden bg-muted"
                  >
                    <img
                      src={img.image_url}
                      alt={`Carousel slide ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 3 && carouselImages.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          +{carouselImages.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Scheduled Time */}
          {post.scheduled_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3 p-2 bg-primary/5 border">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(post.scheduled_at), "MMM d, yyyy 'at' h:mm a")}</span>
              {isScheduledAndDue && (
                <Badge variant="destructive" className="ml-auto text-[10px] h-5">
                  Due
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge variant="outline" className="text-xs">
              {postTypeLabels[post.post_type] || post.post_type}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {post.post_length}
            </Badge>
            {post.media_format && post.media_format !== "text_only" && (
              <Badge variant="outline" className="text-xs">
                {mediaFormatLabels[post.media_format] || post.media_format}
              </Badge>
            )}
            {hasCarouselSlides && (
              <Badge variant="secondary" className="text-xs">
                <Layers className="h-3 w-3 mr-1" />
                {post.carousel_slides!.length} slides
              </Badge>
            )}
            {attachedImage && (
              <Badge variant="outline" className="text-xs">
                <ImageIcon className="h-3 w-3 mr-1" />
                Image
              </Badge>
            )}
            <div className="ml-auto flex items-center gap-1">
              {hasCarouselSlides && (
                <Dialog open={carouselDialogOpen} onOpenChange={setCarouselDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <Layers className="h-3 w-3 mr-1" />
                      View Slides
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Carousel Slides</DialogTitle>
                    </DialogHeader>
                    <CarouselSlidesEditor 
                      slides={post.carousel_slides!} 
                      readOnly={true}
                      brand={currentBrand || undefined}
                    />
                  </DialogContent>
                </Dialog>
              )}
              {currentBrand && (
                <AttachImageDialog
                  postId={post.id}
                  brand={currentBrand}
                  currentImageId={attachedImage?.id}
                  onImageAttached={setAttachedImage}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <ImageIcon className="h-3 w-3" />
                    </Button>
                  }
                />
              )}
              <SchedulePostDialog 
                post={post} 
                brandId={brandId}
                trigger={
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {post.scheduled_at ? "Reschedule" : "Schedule"}
                  </Button>
                }
              />
              {currentBrand && (
                <PublishPostDialog
                  post={post}
                  brandId={brandId}
                  brandName={currentBrand.name}
                  attachedImage={attachedImage}
                  trigger={
                    <Button size="sm" className="h-7 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Publish
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Post Dialog */}
      <Dialog open={viewPostOpen} onOpenChange={setViewPostOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs ${statusConfig[post.status].color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[post.status].label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {postTypeLabels[post.post_type] || post.post_type}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {post.post_length}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Hook */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Hook</h3>
              <p className="font-semibold">{post.hook}</p>
            </div>
            
            {/* Body */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Body</h3>
              <p className="whitespace-pre-wrap">{post.body}</p>
            </div>
            
            {/* CTA */}
            {post.cta && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Call to Action</h3>
                <p>{post.cta}</p>
              </div>
            )}
            
            {/* Full Content Preview */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Full Post</h3>
              <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                {post.full_content}
              </div>
            </div>
            
            {/* Attached Image */}
            {attachedImage && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Attached Image</h3>
                <img src={attachedImage.image_url} alt="Attached" className="max-w-full rounded-lg" />
              </div>
            )}
            
            {/* Carousel Slides */}
            {hasCarouselSlides && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Carousel Slides</h3>
                <CarouselSlidesEditor 
                  slides={post.carousel_slides!} 
                  readOnly={true}
                  brand={currentBrand || undefined}
                />
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t flex-wrap">
            <Button variant="outline" onClick={() => { setViewPostOpen(false); setEditPostOpen(true); }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            {hasCarouselSlides && currentBrand && (
              <Button variant="outline" onClick={() => setExportCarouselOpen(true)}>
                <FileImage className="h-4 w-4 mr-2" />
                Export Carousel
              </Button>
            )}
            {post.status === 'draft' && (
              <Button variant="outline" onClick={() => handleStatusChange("approved")}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            <SchedulePostDialog
              post={post} 
              brandId={brandId}
              trigger={
                <Button variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  {post.scheduled_at ? "Reschedule" : "Schedule"}
                </Button>
              }
            />
            {currentBrand && (
              <PublishPostDialog
                post={post}
                brandId={brandId}
                brandName={currentBrand.name}
                attachedImage={attachedImage}
                trigger={
                  <Button>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Publish Now
                  </Button>
                }
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <EditPostDialog
        post={post}
        brandId={brandId}
        open={editPostOpen}
        onOpenChange={setEditPostOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Carousel Dialog */}
      {hasCarouselSlides && currentBrand && (
        <ExportCarouselDialog
          slides={post.carousel_slides!}
          brand={currentBrand}
          postId={post.id}
          open={exportCarouselOpen}
          onOpenChange={setExportCarouselOpen}
        />
      )}
    </>
  );
}
