import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Check, Trash2, FolderInput, X, Loader2 } from "lucide-react";

interface Board {
  id: string;
  name: string;
}

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkApprove: () => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkMove: (boardId: string) => Promise<void>;
  boards: Board[];
  isLoading?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkApprove,
  onBulkDelete,
  onBulkMove,
  boards,
  isLoading = false,
}: BulkActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<string>("");

  const handleApprove = async () => {
    await onBulkApprove();
  };

  const handleDelete = async () => {
    await onBulkDelete();
    setShowDeleteDialog(false);
  };

  const handleMove = async (boardId: string) => {
    if (boardId) {
      await onBulkMove(boardId);
      setSelectedBoard("");
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {selectedCount} pin{selectedCount !== 1 ? "s" : ""} selected
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Approve Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleApprove}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>

          {/* Move to Board */}
          <Select
            value={selectedBoard}
            onValueChange={(value) => {
              setSelectedBoard(value);
              handleMove(value);
            }}
          >
            <SelectTrigger className="w-[160px] h-9 bg-secondary text-secondary-foreground border-0">
              <FolderInput className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Move to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Remove from board</SelectItem>
              {boards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Delete Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Pins</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} pin
              {selectedCount !== 1 ? "s" : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedCount} Pin{selectedCount !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
