import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBrands } from "@/hooks/useBrands";
import { useGeneratedPosts } from "@/hooks/useGeneratedPosts";
import { useGeneratedImages, GeneratedImage } from "@/hooks/useGeneratedImages";
import { useNotifications } from "@/hooks/useNotifications";
import { ScheduleCalendar } from "@/components/schedule/ScheduleCalendar";
import { SchedulePostDialog } from "@/components/schedule/SchedulePostDialog";
import { ReadyToPublishSection } from "@/components/publish/ReadyToPublishSection";
import { NotificationToggle } from "@/components/notifications/NotificationToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Calendar, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function Schedule() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { currentBrand, brands, isLoading: brandsLoading } = useBrands();
  const { posts, isLoading: postsLoading } = useGeneratedPosts(currentBrand?.id || null);
  const { images, fetchImages } = useGeneratedImages(currentBrand?.id);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const { isSupported, permission, requestPermission } = useNotifications({
    posts,
    brandName: currentBrand?.name || "",
    enabled: notificationsEnabled && !!currentBrand,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && profile && !profile.is_approved) {
      navigate("/pending-approval");
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    if (currentBrand?.id) {
      fetchImages();
    }
  }, [currentBrand?.id]);

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
                ? "Create a brand to start scheduling posts"
                : "Select a brand from the dashboard to manage schedule"}
            </p>
            <Button onClick={() => navigate(brands.length === 0 ? "/brands/new" : "/dashboard")}>
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

  // Create a map of post_id to attached image
  const imagesMap = useMemo(() => {
    const map = new Map<string, GeneratedImage>();
    images.forEach((img) => {
      if (img.post_id) {
        map.set(img.post_id, img);
      }
    });
    return map;
  }, [images]);

  const scheduledPosts = posts.filter((p) => p.scheduled_at);
  const overduePosts = posts.filter(
    (p) =>
      p.status === "scheduled" &&
      p.scheduled_at &&
      new Date(p.scheduled_at) < new Date()
  );
  const unscheduledDrafts = posts.filter((p) => !p.scheduled_at && p.status !== "published");
  const upcomingPosts = scheduledPosts
    .filter((p) => new Date(p.scheduled_at!) > new Date())
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Content Schedule</h1>
            <p className="text-muted-foreground">
              Plan and schedule your LinkedIn posts for {currentBrand.name}
            </p>
          </div>
          <NotificationToggle
            isSupported={isSupported}
            permission={permission}
            enabled={notificationsEnabled}
            onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
            onRequestPermission={requestPermission}
          />
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-foreground">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 border-2 border-foreground">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledPosts.length}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </CardContent>
          </Card>
          <Card className={`border-2 ${overduePosts.length > 0 ? 'border-destructive' : 'border-foreground'}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 border-2 ${overduePosts.length > 0 ? 'border-destructive' : 'border-foreground'}`}>
                <AlertCircle className={`h-5 w-5 ${overduePosts.length > 0 ? 'text-destructive' : ''}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{overduePosts.length}</p>
                <p className="text-sm text-muted-foreground">Ready to Publish</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-foreground">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 border-2 border-foreground">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unscheduledDrafts.length}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-foreground">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Next Post</p>
              {upcomingPosts[0] ? (
                <p className="font-medium">
                  {format(new Date(upcomingPosts[0].scheduled_at!), "MMM d 'at' h:mm a")}
                </p>
              ) : (
                <p className="text-muted-foreground">None scheduled</p>
              )}
            </CardContent>
          </Card>
        </div>

        {postsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate some posts first, then come back to schedule them.
              </p>
              <Button onClick={() => navigate("/content")}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Posts
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Ready to Publish Section */}
            <ReadyToPublishSection
              posts={posts}
              brand={currentBrand}
              imagesMap={imagesMap}
            />

            {/* Calendar View */}
            <ScheduleCalendar posts={posts} brand={currentBrand} />

            {/* Unscheduled Posts */}
            {unscheduledDrafts.length > 0 && (
              <Card className="border-2 border-foreground">
                <CardHeader className="border-b-2 border-foreground">
                  <CardTitle>Ready to Schedule ({unscheduledDrafts.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unscheduledDrafts.slice(0, 6).map((post) => (
                      <div key={post.id} className="p-4 border space-y-3">
                        <div>
                          <p className="font-medium text-sm line-clamp-2">{post.hook}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {post.body}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs capitalize">
                            {post.status}
                          </Badge>
                          <SchedulePostDialog post={post} brandId={currentBrand.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {unscheduledDrafts.length > 6 && (
                    <Button
                      variant="ghost"
                      className="w-full mt-4"
                      onClick={() => navigate("/content")}
                    >
                      View All {unscheduledDrafts.length} Posts
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
