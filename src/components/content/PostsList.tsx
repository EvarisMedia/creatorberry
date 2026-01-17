import { useGeneratedPosts } from "@/hooks/useGeneratedPosts";
import { PostCard } from "./PostCard";
import { GeneratePostsDialog } from "./GeneratePostsDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { ScheduleCalendar } from "@/components/schedule/ScheduleCalendar";

interface PostsListProps {
  brand: {
    id: string;
    name: string;
    tone: string | null;
    writing_style: string | null;
    emoji_usage: string | null;
    about: string | null;
    core_beliefs: string | null;
    opinions: string | null;
    signature_frameworks: string | null;
    target_audience: string | null;
    offers_services: string | null;
    user_id?: string;
    logo_url?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    timezone?: string | null;
    created_at?: string;
    updated_at?: string;
  };
}

export function PostsList({ brand }: PostsListProps) {
  const { posts, isLoading } = useGeneratedPosts(brand.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const draftPosts = posts.filter(p => p.status === "draft" || p.status === "edited");
  const approvedPosts = posts.filter(p => p.status === "approved");
  const scheduledPosts = posts.filter(p => p.status === "scheduled");
  const publishedPosts = posts.filter(p => p.status === "published");

  const renderPosts = (filteredPosts: typeof posts) => {
    if (filteredPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
          <div className="p-3 rounded-full bg-primary/10 mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-1">No posts yet</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Generate your first LinkedIn post using AI
          </p>
          <GeneratePostsDialog brand={brand} />
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} brandId={brand.id} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Content</h2>
          <p className="text-sm text-muted-foreground">
            Generate and manage your LinkedIn posts
          </p>
        </div>
        <GeneratePostsDialog brand={brand} />
      </div>

      <Tabs defaultValue="drafts">
        <TabsList>
          <TabsTrigger value="drafts">
            Drafts {draftPosts.length > 0 && `(${draftPosts.length})`}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved {approvedPosts.length > 0 && `(${approvedPosts.length})`}
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled {scheduledPosts.length > 0 && `(${scheduledPosts.length})`}
          </TabsTrigger>
          <TabsTrigger value="published">
            Published {publishedPosts.length > 0 && `(${publishedPosts.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="mt-4">
          {renderPosts(draftPosts)}
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          {renderPosts(approvedPosts)}
        </TabsContent>
        <TabsContent value="scheduled" className="mt-4">
          <ScheduleCalendar posts={posts} brand={brand as any} />
        </TabsContent>
        <TabsContent value="published" className="mt-4">
          {renderPosts(publishedPosts)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
