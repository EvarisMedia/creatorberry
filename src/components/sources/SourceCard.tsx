import { ContentSource, useContentSources } from "@/hooks/useContentSources";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Rss, Link, Lightbulb, MoreVertical, Trash2, ExternalLink } from "lucide-react";
import { useState } from "react";

interface SourceCardProps {
  source: ContentSource;
  brandId: string;
}

const sourceTypeIcons = {
  rss_feed: Rss,
  blog_url: Link,
  manual_idea: Lightbulb,
};

const sourceTypeLabels = {
  rss_feed: "RSS Feed",
  blog_url: "Blog URL",
  manual_idea: "Manual Idea",
};

const funnelStageColors = {
  awareness: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  authority: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  conversion: "bg-green-500/10 text-green-500 border-green-500/20",
};

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function SourceCard({ source, brandId }: SourceCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { deleteSource, toggleSourceActive } = useContentSources(brandId);
  
  const Icon = sourceTypeIcons[source.source_type];

  const handleToggleActive = () => {
    toggleSourceActive.mutate({
      id: source.id,
      is_active: !source.is_active,
    });
  };

  const handleDelete = () => {
    deleteSource.mutate(source.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <Card className={`transition-opacity ${!source.is_active ? "opacity-60" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{source.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {sourceTypeLabels[source.source_type]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={source.is_active}
                onCheckedChange={handleToggleActive}
                aria-label="Toggle source active"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {source.url && (
                    <DropdownMenuItem asChild>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open URL
                      </a>
                    </DropdownMenuItem>
                  )}
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
          {source.url && (
            <p className="text-xs text-muted-foreground truncate mb-3">
              {source.url}
            </p>
          )}
          {source.content && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {source.content}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {source.topic && (
              <Badge variant="outline" className="text-xs">
                {source.topic}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-xs capitalize ${funnelStageColors[source.funnel_stage]}`}
            >
              {source.funnel_stage}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs capitalize ${priorityColors[source.priority]}`}
            >
              {source.priority}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{source.name}"? This action cannot
              be undone.
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
    </>
  );
}
