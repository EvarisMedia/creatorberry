import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainingItemCard } from "./TrainingItemCard";
import { TrainingItem } from "@/hooks/useTrainingLibrary";
import { Search, Lightbulb, FileText, BookOpen, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TrainingItemsListProps {
  items: TrainingItem[];
  itemsByCategory: Record<string, TrainingItem[]>;
  isLoading: boolean;
  onEdit: (item: TrainingItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  hook: <Lightbulb className="h-4 w-4" />,
  example_post: <FileText className="h-4 w-4" />,
  guideline: <BookOpen className="h-4 w-4" />,
  framework: <Layers className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  hook: "Hooks",
  example_post: "Example Posts",
  guideline: "Guidelines",
  framework: "Frameworks",
};

export function TrainingItemsList({
  items,
  itemsByCategory,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
}: TrainingItemsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filterItems = (items: TrainingItem[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.subcategory?.toLowerCase().includes(query)
    );
  };

  const categories = Object.keys(itemsByCategory);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search training items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">
            All ({items.length})
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="gap-1">
              {categoryIcons[category]}
              {categoryLabels[category] || category} ({itemsByCategory[category]?.length || 0})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {filterItems(items).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No items match your search" : "No training items yet"}
            </div>
          ) : (
            filterItems(items).map((item) => (
              <TrainingItemCard
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
              />
            ))
          )}
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-4 space-y-3">
            {filterItems(itemsByCategory[category] || []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No items match your search" : `No ${categoryLabels[category]?.toLowerCase() || category} yet`}
              </div>
            ) : (
              filterItems(itemsByCategory[category] || []).map((item) => (
                <TrainingItemCard
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleActive={onToggleActive}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
