import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter,  
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  XCircle,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
  Trash2,
  CheckSquare,
  Square,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Card
} from "../../components/ui/card";
import { MenuItemCard } from "../../components/menu/MenuItemCard";
import MenuItemDialog from '../../components/menu/MenuItemDialog';
import { DeleteConfirmDialog } from "../../components/menu/DeleteConfirmDialog";
import ImportItemsDialog from '../../components/items/ImportItemsDialog';
import { MenuItem, menuItemsApi } from "../../lib/api/menuItems";
import { Category, categoriesApi } from "../../lib/api/categories";
import { Menu, menusApi } from "../../lib/api/menus";
import { formatPrice } from "../../lib/utils";

export default function ItemPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const menuId = queryParams.get('menuId');
  
  // Dialog states
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addItemToMenuDialogOpen, setAddItemToMenuDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<MenuItem | undefined>(undefined);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"name" | "price" | "newest">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Add new state variables for subcategory and tag filtering
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // Replace selection states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);

  // Extract unique subcategories and tags from all menu items
  const uniqueSubcategories = useMemo(() => {
    const subcategories = allMenuItems
      .filter(item => item.subcategory)
      .map(item => item.subcategory as string);
    return ["all", ...Array.from(new Set(subcategories))];
  }, [allMenuItems]);

  const uniqueTags = useMemo(() => {
    const tags = allMenuItems
      .flatMap(item => item.tags || []);
    return ["all", ...Array.from(new Set(tags))];
  }, [allMenuItems]);

  // Fetch menu items, categories, and current menu
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsData, categoriesData] = await Promise.all([
        menuItemsApi.getAll(),
        categoriesApi.getAll(),
      ]);
      
      // Store all items for later use
      setAllMenuItems(itemsData);
      setCategories(categoriesData);
      
      // If menuId is provided, fetch the menu
      if (menuId) {
        try {
          const menuData = await menusApi.getById(menuId);
          setCurrentMenu(menuData);
          
          // If menu has items, only display those items
          if (menuData.items && menuData.items.length > 0) {
            const menuItemIds = menuData.items.map(item => item.id);
            setMenuItems(itemsData.filter(item => menuItemIds.includes(item.id)));
          } else {
            // Empty array if no items in menu
            setMenuItems([]);
          }
        } catch (menuError) {
          console.error("Error fetching menu:", menuError);
          toast.error("Failed to load menu");
          // Navigate back to menus page if menu doesn't exist
          navigate('/admin/menus');
        }
      } else {
        // If no menuId, show all items
        setMenuItems(itemsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load menu items. Please try again.");
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [menuId, navigate]);

  // Handle add/edit item
  const handleAddEditItem = async (formData: any) => {
    try {
      // Show loading toast for image uploads
      if (formData.image) {
        toast.loading("Processing image upload...", {
          id: "image-upload",
          duration: 3000,
        });
      }
      
      // Ensure numeric values are properly parsed
      const data = {
        ...formData,
        fullPrice: parseFloat(formData.fullPrice),
        halfPrice: formData.halfPrice ? parseFloat(formData.halfPrice) : undefined,
        preparationTime: parseInt(formData.preparationTime),
        image: formData.image,
      };

      console.log("Submitting item data:", {
        ...data,
        image: data.image ? "Image present" : "No image"
      });

      if (currentItem) {
        // Update existing item
        const updatedItem = await menuItemsApi.update(currentItem.id, data);
        
        // Dismiss loading toast
        if (formData.image) {
          toast.dismiss("image-upload");
        }
        
        // Check if the image URL was returned
        if (formData.image && !updatedItem.imageUrl) {
          console.warn("Image was uploaded but no imageUrl was returned from the server");
          toast.warning("Image may not have been uploaded correctly");
        }
        
        setMenuItems((prev) =>
          prev.map((item) =>
            item.id === currentItem.id
              ? updatedItem
              : item
          )
        );
        toast.success("Menu item updated successfully");
      } else {
        // Create new item
        const newItem = await menuItemsApi.create(data);
        
        // Dismiss loading toast
        if (formData.image) {
          toast.dismiss("image-upload");
        }
        
        // Check if the image URL was returned
        if (formData.image && !newItem.imageUrl) {
          console.warn("Image was uploaded but no imageUrl was returned from the server");
          toast.warning("Image may not have been uploaded correctly");
        }
        
        setMenuItems((prev) => [...prev, newItem]);
        
        // If we're in a specific menu context, add the item to the menu
        if (menuId && currentMenu) {
          try {
            await menusApi.addItem(menuId, newItem.id);
            toast.success("Item added to menu successfully");
          } catch (error) {
            console.error("Error adding item to menu:", error);
            toast.error("Item created but failed to add to menu");
          }
        }
        
        toast.success("Menu item created successfully");
      }
      
      // Close the dialog
      setAddEditDialogOpen(false);
    } catch (error) {
      console.error("Error saving menu item:", error);
      
      // Dismiss loading toast and show error
      toast.dismiss("image-upload");
      toast.error(currentItem ? "Failed to update menu item" : "Failed to create menu item");
    }
  };

  // Handle delete item
  const handleDeleteItem = async () => {
    if (!currentItem) return;
    try {
      // If we're in a menu context, first remove the item from menu
      if (menuId && currentMenu) {
        try {
          await menusApi.removeItem(menuId, currentItem.id);
          // Only remove from the current menu, not delete entirely
          setMenuItems(prev => prev.filter(item => item.id !== currentItem.id));
          toast.success("Item removed from menu successfully");
          return;
        } catch (removeError) {
          console.error("Error removing item from menu:", removeError);
          toast.error("Failed to remove item from menu");
          return;
        }
      }
      
      // If not in a menu context, delete the item completely
      await menuItemsApi.delete(currentItem.id);
      setMenuItems(prev => prev.filter(item => item.id !== currentItem.id));
      setAllMenuItems(prev => prev.filter(item => item.id !== currentItem.id));
      toast.success("Menu item deleted successfully");
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast.error("Failed to delete menu item");
      throw error;
    }
  };

  // Filter and sort menu items
  const filteredItems = menuItems
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || item.categoryId.toString() === selectedCategory;
      
      const matchesAvailability = availabilityFilter === "all" ||
                             (availabilityFilter === "available" && item.isAvailable) ||
                             (availabilityFilter === "unavailable" && !item.isAvailable);
      
      const matchesSubcategory = subcategoryFilter === "all" || 
                             item.subcategory === subcategoryFilter;
      
      const matchesTag = tagFilter === "all" || 
                       (item.tags && item.tags.includes(tagFilter));
      
      return matchesSearch && matchesCategory && matchesAvailability && matchesSubcategory && matchesTag;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortOrder) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = getItemPrice(a) - getItemPrice(b);
          break;
        case "newest":
          // Assuming createdAt is a string date
          comparison = new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  // Go back to menus page
  const handleGoBack = () => {
    navigate('/admin/menus');
  };

  // Add functions to handle adding items to menu and removing them
  const handleAddItemToMenu = async (item: MenuItem) => {
    if (!menuId || !currentMenu) return;
    
    try {
      await menusApi.addItem(menuId, item.id);
      // Add the item to the current menu items
      setMenuItems(prev => [...prev, item]);
      toast.success(`${item.name} added to menu successfully`);
    } catch (error) {
      console.error("Error adding item to menu:", error);
      toast.error(`Failed to add ${item.name} to menu`);
    }
  };

  const handleRemoveItemFromMenu = async (item: MenuItem) => {
    if (!menuId || !currentMenu) return;
    
    setCurrentItem(item);
    setDeleteDialogOpen(true);
  };

  // Get items that can be added to the current menu
  const getItemsNotInMenu = () => {
    if (!menuItems.length) return allMenuItems;
    
    const currentItemIds = menuItems.map(item => item.id);
    return allMenuItems.filter(item => !currentItemIds.includes(item.id));
  };

  // Helper function to get the price from an item (handles both fullPrice and price)
  const getItemPrice = (item: any): number => {
    if (!item) return 0;
    
    // Handle fullPrice first (new schema)
    if (item.fullPrice !== undefined && item.fullPrice !== null) {
      const fullPrice = typeof item.fullPrice === 'number' ? item.fullPrice : parseFloat(String(item.fullPrice));
      return isNaN(fullPrice) ? 0 : fullPrice;
    }
    
    // Legacy support for price field
    if (item.price !== undefined && item.price !== null) {
      const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price));
      return isNaN(price) ? 0 : price;
    }
    
    return 0;
  };

  // Handle import complete
  const handleImportComplete = () => {
    fetchData();
  };

  // Replace selection handlers
  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (item: MenuItem, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, item.id]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== item.id));
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      // If all are selected, deselect all
      setSelectedItems([]);
    } else {
      // Otherwise, select all
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const isAllSelected = filteredItems.length > 0 && 
                       selectedItems.length === filteredItems.length;

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      // Create a loading toast with an ID
      const toastId = "batch-delete-toast";
      toast.loading(`Deleting ${selectedItems.length} items...`, { id: toastId });
      
      if (currentMenu) {
        // Remove selected items from menu
        await Promise.all(
          selectedItems.map(id => menusApi.removeItem(menuId!, id))
        );
        setMenuItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
        // Dismiss loading toast and show success toast
        toast.dismiss(toastId);
        toast.success(`${selectedItems.length} items removed from menu successfully`);
      } else {
        // Delete items completely
        await Promise.all(
          selectedItems.map(id => menuItemsApi.delete(id))
        );
        setMenuItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
        setAllMenuItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
        // Dismiss loading toast and show success toast
        toast.dismiss(toastId);
        toast.success(`${selectedItems.length} items deleted successfully`);
      }
      
      // Reset selection
      setSelectedItems([]);
      setSelectionMode(false);
      setBatchDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error batch deleting items:", error);
      // Dismiss loading toast and show error toast
      toast.dismiss("batch-delete-toast");
      toast.error("Failed to delete some items");
    }
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
              {currentMenu ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="icon" onClick={handleGoBack} className="h-8 w-8">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">
                      {currentMenu.name}
                    </h1>
                  </div>
                  <p className="text-muted-foreground">
                    Manage items for this menu
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold tracking-tight">Manage Menu Items</h1>
                  <p className="text-muted-foreground">Add, edit and manage your menu items</p>
                </>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectionMode ? (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      if (selectedItems.length > 0) {
                        setBatchDeleteDialogOpen(true);
                      } else {
                        toast.error("No items selected");
                      }
                    }}
                    disabled={selectedItems.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedItems.length})
                  </Button>
                  <Button variant="outline" onClick={toggleSelectionMode}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={toggleSelectionMode}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Select Multiple
                  </Button>
                  {currentMenu && (
                    <Button 
                      variant="outline" 
                      onClick={() => setAddItemToMenuDialogOpen(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Existing Item
                    </Button>
                  )}
                  {!currentMenu && (
                    <Button
                      variant="outline"
                      onClick={() => setImportDialogOpen(true)}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Import from Excel
                    </Button>
                  )}
                  <Button onClick={() => {
                    setCurrentItem(undefined);
                    setAddEditDialogOpen(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    {currentMenu ? "Create New Item" : "Add New Item"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <Separator />

        <div className="space-y-4">
          <div className="bg-card rounded-lg border shadow-sm p-1">
            <div className="p-4 flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
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

              <div className="flex gap-2 items-center ml-auto">
                {selectionMode && filteredItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={handleSelectAll}
                  >
                    {isAllSelected ? (
                      <>
                        <Square className="h-4 w-4 mr-1" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Select All
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  onClick={fetchData}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 ml-auto"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {isFilterExpanded ? (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Sort by: {sortOrder}
                      {sortDirection === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortOrder("name")}>
                      Name {sortOrder === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder("price")}>
                      Price {sortOrder === "price" && (sortDirection === "asc" ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                      Newest {sortOrder === "newest" && (sortDirection === "asc" ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleSortDirection}>
                      {sortDirection === "asc" ? "Ascending ↑" : "Descending ↓"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <AnimatePresence>
              {isFilterExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Category</label>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Availability</label>
                      <Select
                        value={availabilityFilter}
                        onValueChange={setAvailabilityFilter}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Availability" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Items</SelectItem>
                          <SelectItem value="available">Available Items</SelectItem>
                          <SelectItem value="unavailable">Unavailable Items</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subcategory filter */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">Subcategory</label>
                      <Select
                        value={subcategoryFilter}
                        onValueChange={setSubcategoryFilter}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Subcategories" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueSubcategories.map((subcategory) => (
                            <SelectItem key={subcategory} value={subcategory}>
                              {subcategory === "all" ? "All Subcategories" : subcategory}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Tags filter */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">Filter by Tag</label>
                      <Select
                        value={tagFilter}
                        onValueChange={setTagFilter}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Tags" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueTags.map((tag) => (
                            <SelectItem key={tag} value={tag}>
                              {tag === "all" ? "All Tags" : tag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-lg border overflow-hidden">
                  <div className="aspect-video bg-muted">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-destructive/10 p-4 rounded-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
              <Button variant="outline" size="sm" className="ml-auto" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== "all" || availabilityFilter !== "all"
                  ? "No items match your filters"
                  : currentMenu
                    ? "No items in this menu yet"
                    : "No menu items available yet"}
              </p>
              {currentMenu ? (
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setAddItemToMenuDialogOpen(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Existing Item
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => {
                      setCurrentItem(undefined);
                      setAddEditDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Item
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCurrentItem(undefined);
                    setAddEditDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first item
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredItems.map((item) => (
                  <div key={item.id} className="relative group">
                    {selectionMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={() => handleSelectItem(item, !selectedItems.includes(item.id))}
                      >
                        {selectedItems.includes(item.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {currentMenu && !selectionMode && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={() => handleRemoveItemFromMenu(item)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <div className={`${selectedItems.includes(item.id) ? 'ring-2 ring-primary/70 bg-primary/5 rounded-lg' : ''}`}>
                      <MenuItemCard
                        item={item}
                        onEdit={(item) => {
                          setCurrentItem(item);
                          setAddEditDialogOpen(true);
                        }}
                        onDelete={(item) => {
                          setCurrentItem(item);
                          if (currentMenu) {
                            handleRemoveItemFromMenu(item);
                          } else {
                            setDeleteDialogOpen(true);
                          }
                        }}
                        delay={0}
                      />
                    </div>
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Menu Item Form Dialog */}
      <MenuItemDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        onSubmit={handleAddEditItem}
        categories={categories}
        menuItem={currentItem}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        menuItem={currentItem}
        onConfirm={handleDeleteItem}
      />

      {/* Add dialog for selecting existing items to add to menu */}
      <Dialog open={addItemToMenuDialogOpen} onOpenChange={setAddItemToMenuDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Items to Menu</DialogTitle>
            <DialogDescription>
              Select items to add to {currentMenu?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {getItemsNotInMenu().length === 0 ? (
              <div className="text-center py-8 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  All available items are already in this menu
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {getItemsNotInMenu()
                  .filter(item => 
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
                  )
                  .map(item => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        <img
                          src={item.imageUrl || "https://placehold.co/600x400/213555/e0f4ff?text=No+Image"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/600x400/213555/e0f4ff?text=No+Image";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                          <div className="w-full">
                            <div className="text-white font-medium truncate">{item.name}</div>
                            {item.subcategory && (
                              <div className="text-white/80 text-xs truncate mt-1">
                                Subcategory: {item.subcategory}
                              </div>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                                {item.tags.length > 2 && (
                                  <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                                    +{item.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <div className="text-sm font-medium">
                          {formatPrice(getItemPrice(item))}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            handleAddItemToMenu(item);
                            setAddItemToMenuDialogOpen(false);
                          }}
                        >
                          <PlusCircle className="mr-1 h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </Card>
                  ))
                }
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddItemToMenuDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ImportItemsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={handleImportComplete}
      />

      {/* Add Batch Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
        menuItem={undefined}
        onConfirm={handleBatchDelete}
        title="Delete Multiple Items"
        description={`Are you sure you want to delete ${selectedItems.length} items? This action cannot be undone.`}
      />
    </AdminLayout>
  );
} 