import { useState, useCallback } from "react";
import { usePins, useAllPinVariations, Pin } from "@/hooks/usePins";
import { useBoards } from "@/hooks/useBoards";
import { PinCard } from "./PinCard";
import { GeneratePinsDialog } from "./GeneratePinsDialog";
import { ExportPinsDialog } from "./ExportPinsDialog";
import { BulkActionsBar } from "./BulkActionsBar";
import { PinTemplatesList } from "./PinTemplatesList";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pin as PinIcon, Search, LayoutGrid, CheckSquare, Layout } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  niche?: string | null;
  primary_keywords?: string[] | null;
  pin_design_style?: string | null;
  target_audience?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  logo_watermark_enabled?: boolean | null;
}

interface PinsListProps {
  brand: Brand;
}

export function PinsList({ brand }: PinsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBoard, setSelectedBoard] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPins, setSelectedPins] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const { pins, isLoading, bulkApprove, bulkDelete, bulkMove } = usePins(brand.id);
  const { boards } = useBoards(brand.id);
  const { variations } = useAllPinVariations(brand.id);

  // Create a map of pin IDs to their selected variation's image URL
  const getImageUrl = useCallback((pinId: string): string | undefined => {
    const selectedVariation = variations.find(
      (v) => v.pin_id === pinId && v.is_selected
    );
    return selectedVariation?.image_url || undefined;
  }, [variations]);

  const togglePinSelection = useCallback((pinId: string) => {
    setSelectedPins((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pinId)) {
        newSet.delete(pinId);
      } else {
        newSet.add(pinId);
      }
      return newSet;
    });
  }, []);

  const selectAllInTab = useCallback((pinList: Pin[]) => {
    setSelectedPins(new Set(pinList.map((p) => p.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPins(new Set());
    setIsSelectionMode(false);
  }, []);

  const handleBulkApprove = async () => {
    if (selectedPins.size === 0) return;
    setIsBulkLoading(true);
    try {
      await bulkApprove.mutateAsync(Array.from(selectedPins));
      clearSelection();
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPins.size === 0) return;
    setIsBulkLoading(true);
    try {
      await bulkDelete.mutateAsync(Array.from(selectedPins));
      clearSelection();
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkMove = async (boardId: string) => {
    if (selectedPins.size === 0) return;
    setIsBulkLoading(true);
    try {
      await bulkMove.mutateAsync({
        ids: Array.from(selectedPins),
        boardId: boardId === "none" ? null : boardId,
      });
      clearSelection();
    } finally {
      setIsBulkLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  // Filter pins
  let filteredPins = pins;
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredPins = filteredPins.filter(
      (pin) =>
        pin.title.toLowerCase().includes(query) ||
        pin.description?.toLowerCase().includes(query) ||
        pin.keywords?.some((k) => k.toLowerCase().includes(query))
    );
  }

  if (selectedBoard !== "all") {
    filteredPins = filteredPins.filter((pin) => pin.board_id === selectedBoard);
  }

  if (selectedType !== "all") {
    filteredPins = filteredPins.filter((pin) => pin.pin_type === selectedType);
  }

  const draftPins = filteredPins.filter((p) => p.status === "draft");
  const approvedPins = filteredPins.filter((p) => p.status === "approved");
  const publishedPins = filteredPins.filter((p) => p.status === "published");

  const renderSelectAllToggle = (pinList: Pin[]) => {
    if (pinList.length === 0) return null;

    const allSelected = pinList.every((p) => selectedPins.has(p.id));
    const someSelected = pinList.some((p) => selectedPins.has(p.id));

    return (
      <div className="flex items-center gap-2 mb-4">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              selectAllInTab(pinList);
            } else {
              setSelectedPins(new Set());
            }
          }}
          className={someSelected && !allSelected ? "opacity-50" : ""}
        />
        <span className="text-sm text-muted-foreground">
          Select all ({pinList.length})
        </span>
      </div>
    );
  };

  const renderPins = (pinList: Pin[]) => {
    if (pinList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
          <div className="p-3 rounded-full bg-primary/10 mb-4">
            <PinIcon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-1">No pins yet</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Generate your first Pinterest pins using AI
          </p>
          <GeneratePinsDialog brand={brand} />
        </div>
      );
    }

    return (
      <>
        {isSelectionMode && renderSelectAllToggle(pinList)}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pinList.map((pin) => (
            <PinCard
              key={pin.id}
              pin={pin}
              brand={brand}
              isSelectionMode={isSelectionMode}
              isSelected={selectedPins.has(pin.id)}
              onToggleSelect={() => togglePinSelection(pin.id)}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      {selectedPins.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedPins.size}
          onClearSelection={clearSelection}
          onBulkApprove={handleBulkApprove}
          onBulkDelete={handleBulkDelete}
          onBulkMove={handleBulkMove}
          boards={boards}
          isLoading={isBulkLoading}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl font-semibold">Pins</h2>
          <p className="text-sm text-muted-foreground">
            Generate and manage your Pinterest pins
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filteredPins.length > 0 && (
            <>
              <Button
                variant={isSelectionMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) {
                    clearSelection();
                  }
                }}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                {isSelectionMode ? "Cancel" : "Select"}
              </Button>
              <ExportPinsDialog 
                pins={filteredPins} 
                brandName={brand.name} 
                getImageUrl={getImageUrl}
              />
            </>
          )}
          <GeneratePinsDialog brand={brand} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedBoard} onValueChange={setSelectedBoard}>
          <SelectTrigger className="w-[180px]">
            <LayoutGrid className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All boards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All boards</SelectItem>
            {boards.map((board) => (
              <SelectItem key={board.id} value={board.id}>
                {board.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="blog">Blog</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="infographic">Infographic</SelectItem>
            <SelectItem value="listicle">Listicle</SelectItem>
            <SelectItem value="comparison">Comparison</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="drafts">
        <TabsList>
          <TabsTrigger value="drafts">
            Drafts {draftPins.length > 0 && `(${draftPins.length})`}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved {approvedPins.length > 0 && `(${approvedPins.length})`}
          </TabsTrigger>
          <TabsTrigger value="published">
            Published {publishedPins.length > 0 && `(${publishedPins.length})`}
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Layout className="h-4 w-4 mr-1.5" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="mt-4">
          {renderPins(draftPins)}
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          {renderPins(approvedPins)}
        </TabsContent>
        <TabsContent value="published" className="mt-4">
          {renderPins(publishedPins)}
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <PinTemplatesList brandId={brand.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
