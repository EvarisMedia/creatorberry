import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GeneratedPost } from "@/hooks/useGeneratedPosts";
import { GeneratedImage } from "@/hooks/useGeneratedImages";
import { Brand } from "@/hooks/useBrands";
import { PublishPostDialog } from "./PublishPostDialog";
import { SchedulePostDialog } from "@/components/schedule/SchedulePostDialog";

interface ReadyToPublishSectionProps {
  posts: GeneratedPost[];
  brand: Brand;
  imagesMap: Map<string, GeneratedImage>;
}

export function ReadyToPublishSection({
  posts,
  brand,
  imagesMap,
}: ReadyToPublishSectionProps) {
  // Filter posts that are scheduled and overdue (scheduled_at < now)
  const readyToPublish = useMemo(() => {
    const now = new Date();
    return posts
      .filter(
        (post) =>
          post.status === "scheduled" &&
          post.scheduled_at &&
          new Date(post.scheduled_at) < now
      )
      .sort((a, b) => {
        // Sort by most overdue first
        const dateA = new Date(a.scheduled_at!);
        const dateB = new Date(b.scheduled_at!);
        return dateA.getTime() - dateB.getTime();
      });
  }, [posts]);

  if (readyToPublish.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Ready to Publish
          <Badge variant="destructive" className="ml-2">
            {readyToPublish.length} overdue
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {readyToPublish.map((post) => {
          const attachedImage = imagesMap.get(post.id);
          const overdueTime = formatDistanceToNow(new Date(post.scheduled_at!), {
            addSuffix: true,
          });

          return (
            <div
              key={post.id}
              className="flex items-start gap-4 p-4 bg-background border-2 border-border"
            >
              {/* Image thumbnail */}
              {attachedImage ? (
                <div className="w-16 h-16 flex-shrink-0 border border-border overflow-hidden">
                  <img
                    src={attachedImage.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 flex-shrink-0 border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                  <span className="text-xs text-muted-foreground">No img</span>
                </div>
              )}

              {/* Post content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-2 text-sm">{post.hook}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Scheduled {overdueTime}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <SchedulePostDialog
                  post={post}
                  brandId={brand.id}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Reschedule
                    </Button>
                  }
                />
                <PublishPostDialog
                  post={post}
                  brandId={brand.id}
                  brandName={brand.name}
                  attachedImage={attachedImage}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
