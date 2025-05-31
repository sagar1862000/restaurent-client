import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { Category } from "../../lib/api/categories";

interface DeleteCategoryConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  onConfirm: () => void;
  itemCount?: number;
  title?: string;
  description?: string;
}

export function DeleteCategoryConfirmDialog({
  open,
  onOpenChange,
  category,
  onConfirm,
  itemCount = 0,
  title,
  description,
}: DeleteCategoryConfirmDialogProps) {
  if (!category && !title && !description) return null;

  const hasItems = itemCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center text-destructive mb-2">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <AlertDialogTitle>{title || "Delete Category"}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ? (
              <p>{description}</p>
            ) : hasItems ? (
              <>
                <p className="mb-2">
                  <strong>{category?.name}</strong> contains {itemCount} {itemCount === 1 ? 'item' : 'items'}.
                </p>
                <p className="font-medium text-destructive">
                  You cannot delete a category that contains items. Please move or delete the items first.
                </p>
              </>
            ) : (
              <>
                <p className="mb-2">
                  Are you sure you want to delete <strong>{category?.name}</strong>?
                </p>
                <p>This action cannot be undone.</p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {(!hasItems || description) && (
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 