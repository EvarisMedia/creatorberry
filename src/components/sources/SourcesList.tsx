import { useContentSources } from "@/hooks/useContentSources";
import { SourceCard } from "./SourceCard";
import { AddSourceDialog } from "./AddSourceDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Rss } from "lucide-react";

interface SourcesListProps {
  brandId: string;
}

export function SourcesList({ brandId }: SourcesListProps) {
  const { sources, isLoading } = useContentSources(brandId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Content Sources</h2>
          <p className="text-sm text-muted-foreground">
            Add RSS feeds, blog URLs, or manual ideas to generate content from
          </p>
        </div>
        <AddSourceDialog brandId={brandId} />
      </div>

      {sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
          <div className="p-3 rounded-full bg-primary/10 mb-4">
            <Rss className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-1">No sources yet</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Add your first content source to start generating Instagram posts
          </p>
          <AddSourceDialog brandId={brandId} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => (
            <SourceCard key={source.id} source={source} brandId={brandId} />
          ))}
        </div>
      )}
    </div>
  );
}
