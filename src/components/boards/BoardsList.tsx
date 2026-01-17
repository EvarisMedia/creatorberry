import { useState } from "react";
import { useBoards, Board } from "@/hooks/useBoards";
import { BoardCard } from "./BoardCard";
import { BoardDialog } from "./BoardDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BoardsListProps {
  brandId: string;
}

export function BoardsList({ brandId }: BoardsListProps) {
  const { boards, isLoading } = useBoards(brandId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBoard, setEditBoard] = useState<Board | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (board: Board) => {
    setEditBoard(board);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditBoard(null);
    }
  };

  const filteredBoards = boards.filter(
    (board) =>
      board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.keywords?.some((k) =>
        k.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" />
            Boards
          </h1>
          <p className="text-muted-foreground">
            Organize your pins into themed boards with SEO keywords
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Board
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search boards by name, description, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Boards Grid */}
      {filteredBoards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mb-4" />
          {boards.length === 0 ? (
            <>
              <h3 className="font-semibold text-lg mb-1">No boards yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first board to start organizing your pins
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Board
              </Button>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-lg mb-1">No matching boards</h3>
              <p className="text-muted-foreground">
                Try adjusting your search query
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              brandId={brandId}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <BoardDialog
        brandId={brandId}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editBoard={editBoard}
      />
    </div>
  );
}
