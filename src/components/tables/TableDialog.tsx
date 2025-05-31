import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table } from "../../lib/api/tables";
import { Menu } from "../../lib/api/menus";

// Schema for form validation
const tableFormSchema = z.object({
  tableNumber: z.coerce.number().min(1, "Table number must be at least 1"),
  location: z.string().optional(),
  menuId: z.string().min(1, "Menu is required"),
});

type TableFormValues = z.infer<typeof tableFormSchema>;

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formValues: TableFormValues) => Promise<void>;
  table?: Table;
  menus: Menu[];
}

export default function TableDialog({
  open,
  onOpenChange,
  onSubmit,
  table,
  menus,
}: TableDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default form values
  const defaultValues = {
    tableNumber: table?.tableNumber || 1,
    location: table?.location || "",
    menuId: table?.menuId ? String(table.menuId) : "",
  };

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues,
  });

  // Reset the form when the dialog opens or table changes
  useEffect(() => {
    if (open) {
      form.reset({
        tableNumber: table?.tableNumber || 1,
        location: table?.location || "",
        menuId: table?.menuId ? String(table.menuId) : "",
      });
    }
  }, [open, table, form]);

  async function handleSubmit(values: TableFormValues) {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting table form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{table ? "Edit Table" : "Add New Table"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tableNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Number</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Patio, Main Hall" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="menuId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a menu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {menus.map((menu) => (
                        <SelectItem key={menu.id} value={String(menu.id)}>
                          {menu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : table ? "Update Table" : "Create Table"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 