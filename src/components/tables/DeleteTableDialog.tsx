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
import { Table } from "../../lib/api/tables";

interface DeleteTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: Table;
  onConfirm: () => Promise<void>;
}

export function DeleteTableDialog({
  open,
  onOpenChange,
  table,
  onConfirm,
}: DeleteTableDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {table && (
              <span>
                This will delete Table #{table.tableNumber}
                {table.location ? ` (${table.location})` : ""}.
                <br />
                <br />
                This action cannot be undone.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 