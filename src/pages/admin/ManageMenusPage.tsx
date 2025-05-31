import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  XCircle,
  Edit,
  Trash,
  ShoppingBag,
  AlertTriangle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "../../components/ui/badge";
import { Menu, menusApi } from "../../lib/api/menus";
import { useNavigate } from "react-router-dom";
import { Switch } from "../../components/ui/switch";

// Schema for menu form validation
const menuFormSchema = z.object({
  name: z.string().min(1, "Menu name is required"),
  description: z.string().optional(),
  isAcceptingOrders: z.boolean().default(true),
});

type MenuFormValues = z.infer<typeof menuFormSchema>;

// Delete Confirmation Dialog
function DeleteConfirmDialog({ isOpen, onClose, onConfirm, menuName }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => Promise<void>; 
  menuName: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Failed to delete menu:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Menu</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the menu "{menuName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Menu Dialog for creating and editing menus
function MenuDialog({ isOpen, onClose, menu, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  menu?: Menu;
  onSave: (data: MenuFormValues) => Promise<void>;
}) {
  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema) as any,
    defaultValues: {
      name: menu?.name || "",
      description: menu?.description || "",
      isAcceptingOrders: menu?.isAcceptingOrders !== undefined ? menu.isAcceptingOrders : true,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when menu changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: menu?.name || "",
        description: menu?.description || "",
        isAcceptingOrders: menu?.isAcceptingOrders !== undefined ? menu.isAcceptingOrders : true,
      });
    }
  }, [isOpen, menu, form]);

  const handleSubmit = async (data: MenuFormValues) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Failed to save menu:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{menu ? "Edit Menu" : "Create New Menu"}</DialogTitle>
          <DialogDescription>
            {menu 
              ? "Update the details of your menu" 
              : "Add a new menu to your restaurant"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-4">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter menu name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter menu description" {...field} />
                  </FormControl>
                  <FormDescription>
                    Provide a brief description for this menu
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="isAcceptingOrders"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accepting Orders</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (menu ? "Update Menu" : "Create Menu")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Menu Card Component
function MenuCard({ menu, onEdit, onDelete, onManageItems, onToggleOrderAcceptance }: { 
  menu: Menu; 
  onEdit: () => void; 
  onDelete: () => void;
  onManageItems: () => void;
  onToggleOrderAcceptance: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{menu.name}</CardTitle>
              <CardDescription>
                {menu.description || "No description provided"}
              </CardDescription>
            </div>
            <Button 
              variant={menu.isAcceptingOrders ? "default" : "outline"} 
              size="sm"
              onClick={onToggleOrderAcceptance}
              className="flex items-center gap-1"
            >
              {menu.isAcceptingOrders ? (
                <>
                  <ToggleRight className="h-4 w-4" />
                  <span className="text-xs">Accepting Orders</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4" />
                  <span className="text-xs">Not Accepting Orders</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Items: </span>
                <Badge variant="outline">{menu.totalItems || 0}</Badge>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Tables: </span>
                <Badge variant="outline">{menu.totalTables || 0}</Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Created on {new Date(menu.createdAt).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/50 p-2">
          <Button variant="ghost" size="sm" onClick={onManageItems}>
            <ShoppingBag className="h-4 w-4 mr-1" />
            Manage Items
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function ManageMenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Dialog states
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<Menu | undefined>(undefined);
  
  const navigate = useNavigate();

  // Fetch menus
  const fetchMenus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await menusApi.getAll();
      setMenus(data);
    } catch (err) {
      console.error("Error fetching menus:", err);
      setError("Failed to load menus. Please try again.");
      toast.error("Failed to load menus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // Handle create/update menu
  const handleSaveMenu = async (data: MenuFormValues) => {
    try {
      if (currentMenu) {
        // Update existing menu
        const updatedMenu = await menusApi.update(currentMenu.id, {
          name: data.name,
          description: data.description,
          isAcceptingOrders: data.isAcceptingOrders
        });
        setMenus(prev => prev.map(menu => 
          menu.id === currentMenu.id ? updatedMenu : menu
        ));
        toast.success("Menu updated successfully");
      } else {
        // Create new menu
        const newMenu = await menusApi.create({
          name: data.name,
          description: data.description,
          isAcceptingOrders: data.isAcceptingOrders
        });
        setMenus(prev => [...prev, newMenu]);
        toast.success("Menu created successfully");
      }
    } catch (error) {
      console.error("Error saving menu:", error);
      toast.error(currentMenu ? "Failed to update menu" : "Failed to create menu");
      throw error;
    }
  };

  // Handle delete menu
  const handleDeleteMenu = async () => {
    if (!currentMenu) return;
    try {
      await menusApi.delete(currentMenu.id);
      setMenus(prev => prev.filter(menu => menu.id !== currentMenu.id));
      toast.success("Menu deleted successfully");
    } catch (error) {
      console.error("Error deleting menu:", error);
      toast.error("Failed to delete menu");
      throw error;
    }
  };

  // Toggle order acceptance
  const handleToggleOrderAcceptance = async (menu: Menu) => {
    try {
      const updatedMenu = await menusApi.toggleOrderAcceptance(
        menu.id, 
        !menu.isAcceptingOrders
      );
      
      setMenus(prev => prev.map(m => 
        m.id === menu.id ? updatedMenu : m
      ));
      
      toast.success(`Menu is now ${updatedMenu.isAcceptingOrders ? 'accepting' : 'not accepting'} orders`);
    } catch (error) {
      console.error("Error toggling order acceptance:", error);
      toast.error("Failed to update order acceptance status");
    }
  };

  // Filter and sort menus
  const filteredMenus = menus
    .filter(menu => 
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (menu.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    )
    .sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  // Navigate to manage menu items
  const handleManageItems = (menuId: string) => {
    navigate(`/admin/items?menuId=${menuId}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Menus</h1>
              <p className="text-muted-foreground">Create and manage your restaurant menus</p>
            </div>
            <Button onClick={() => {
              setCurrentMenu(undefined);
              setMenuDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Menu
            </Button>
          </div>
        </motion.div>

        <Separator />

        <div className="space-y-4">
          <div className="bg-card rounded-lg border shadow-sm p-1">
            <div className="p-4 flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menus..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="absolute right-2.5 top-2.5"
                    onClick={() => setSearchQuery("")}
                  >
                    <XCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-9 ml-auto"
                onClick={toggleSortDirection}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Sort: {sortDirection === "asc" ? "A-Z" : "Z-A"}
                {sortDirection === "asc" ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between bg-muted/50 p-2">
                    <Skeleton className="h-8 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="bg-destructive/10 p-4 rounded-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          ) : filteredMenus.length === 0 ? (
            <div className="text-center py-10 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-2">
                {searchQuery 
                  ? "No menus found matching your search" 
                  : "No menus available yet"}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentMenu(undefined);
                  setMenuDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create your first menu
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredMenus.map((menu) => (
                  <MenuCard
                    key={menu.id}
                    menu={menu}
                    onEdit={() => {
                      setCurrentMenu(menu);
                      setMenuDialogOpen(true);
                    }}
                    onDelete={() => {
                      setCurrentMenu(menu);
                      setDeleteDialogOpen(true);
                    }}
                    onManageItems={() => handleManageItems(menu.id)}
                    onToggleOrderAcceptance={() => handleToggleOrderAcceptance(menu)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Menu Form Dialog */}
      <MenuDialog
        isOpen={menuDialogOpen}
        onClose={() => setMenuDialogOpen(false)}
        menu={currentMenu}
        onSave={handleSaveMenu}
      />

      {/* Delete Confirmation Dialog */}
      {currentMenu && (
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteMenu}
          menuName={currentMenu.name}
        />
      )}
    </AdminLayout>
  );
} 