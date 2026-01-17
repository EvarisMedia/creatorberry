import { Board, useBoards } from "@/hooks/useBoards";
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
import { LayoutGrid, MoreVertical, Trash2, Edit, Hash, Pin } from "lucide-react";
import { useState } from "react";

interface BoardCardProps {
  board: Board;
  brandId: string;
  onEdit: (board: Board) => void;
}

export function BoardCard({ board, brandId, onEdit }: BoardCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { deleteBoard, toggleBoardActive } = useBoards(brandId);

  const handleToggleActive = () => {
    toggleBoardActive.mutate({
      id: board.id,
      is_active: !board.is_active,
    });
  };

  const handleDelete = () => {
    deleteBoard.mutate(board.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <Card className={`transition-all hover:shadow-md ${!board.is_active ? "opacity-60" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <LayoutGrid className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{board.name}</h3>
                {board.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {board.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={board.is_active}
                onCheckedChange={handleToggleActive}
                aria-label="Toggle board active"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(board)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Board
                  </DropdownMenuItem>
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
          {/* Pin Count */}
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Pin className="h-4 w-4" />
            <span>{board.pin_count || 0} pins</span>
          </div>

          {/* Keywords */}
          {board.keywords && board.keywords.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" />
                Keywords
              </div>
              <div className="flex flex-wrap gap-1">
                {board.keywords.slice(0, 5).map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {board.keywords.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{board.keywords.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Content Themes */}
          {board.content_themes && board.content_themes.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Themes</div>
              <div className="flex flex-wrap gap-1">
                {board.content_themes.slice(0, 3).map((theme, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-primary/5">
                    {theme}
                  </Badge>
                ))}
                {board.content_themes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{board.content_themes.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{board.name}"? This will also remove
              all pins associated with this board. This action cannot be undone.
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
