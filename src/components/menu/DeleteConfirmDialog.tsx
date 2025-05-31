import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle } from "lucide-react";
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
import { MenuItem } from "../../lib/api/menuItems";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem?: MenuItem;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  menuItem,
  onConfirm,
  title,
  description,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  if (!menuItem && !title && !description) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AnimatePresence mode="wait">
          <motion.div
            key="delete-dialog"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
          >
            <AlertDialogHeader>
              <div className="flex flex-col items-center gap-2 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-amber-100 dark:bg-amber-950 p-3 rounded-full"
                >
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                </motion.div>
                <AlertDialogTitle>
                  {title || (menuItem ? `Delete ${menuItem.name}?` : "Delete Items?")}
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-center pt-2">
                {description || (menuItem ? "Are you sure you want to delete this menu item? This action cannot be undone." : "This action cannot be undone.")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirm();
                }}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </motion.div>
        </AnimatePresence>
      </AlertDialogContent>
    </AlertDialog>
  );
} 