import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  XCircle,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Trash2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { Skeleton } from "../../components/ui/skeleton";
import { CategoryCard } from "../../components/category/CategoryCard";
import CategoryDialog from "../../components/category/CategoryDialog";
import { DeleteCategoryConfirmDialog } from "../../components/category/DeleteCategoryConfirmDialog";
import ImportCategoriesDialog from "../../components/category/ImportCategoriesDialog";
import { Category, categoriesApi } from "../../lib/api/categories";
import { MenuItem, menuItemsApi } from "../../lib/api/menuItems";

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | undefined>(
    undefined
  );

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");

  // Selection states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);

  // Fetch categories and menu items
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesData, menuItemsData] = await Promise.all([
        categoriesApi.getAll(),
        menuItemsApi.getAll(),
      ]);
      setCategories(categoriesData);
      setMenuItems(menuItemsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load categories. Please try again.");
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle add/edit category
  const handleAddEditCategory = async (formData: any) => {
    try {
      if (currentCategory) {
        // Update existing category
        const updatedCategory = await categoriesApi.update(currentCategory.id, formData);
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === currentCategory.id
              ? {
                  ...cat,
                  ...updatedCategory,
                }
              : cat
          )
        );
        toast.success("Category updated successfully");
      } else {
        // Create new category
        const newCategory = await categoriesApi.create(formData);
        setCategories((prev) => [...prev, newCategory]);
        toast.success("Category created successfully");
      }
      setAddEditDialogOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(
        currentCategory
          ? "Failed to update category"
          : "Failed to create category"
      );
    }
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!currentCategory) return;
    try {
      await categoriesApi.delete(currentCategory.id);
      setCategories((prev) =>
        prev.filter((cat) => cat.id !== currentCategory.id)
      );
      toast.success("Category deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  // Handle batch delete categories
  const handleBatchDeleteCategories = async () => {
    if (selectedCategories.length === 0) return;

    try {
      // Create a loading toast
      toast.loading(`Deleting ${selectedCategories.length} categories...`);
      
      // Delete each selected category
      const deletePromises = selectedCategories.map(id => 
        categoriesApi.delete(id)
      );
      
      await Promise.all(deletePromises);
      
      // Update local state
      setCategories(prev => 
        prev.filter(cat => !selectedCategories.includes(cat.id))
      );
      
      // Reset selection
      setSelectedCategories([]);
      setSelectionMode(false);
      
      // Show success toast
      toast.success(`${selectedCategories.length} categories deleted successfully`);
      setBatchDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error batch deleting categories:", error);
      toast.error("Failed to delete some categories");
    }
  };

  // Get count of items in each category
  const getCategoryItemCount = (categoryId: number) => {
    return menuItems.filter((item) => item.categoryId === categoryId).length;
  };

  // Filter categories
  const filteredCategories = categories
    .filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Handle import complete
  const handleImportComplete = () => {
    fetchData();
  };

  // Selection handlers
  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (category: Category, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCategories(prev => [...prev, category.id]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== category.id));
    }
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      // If all are selected, deselect all
      setSelectedCategories([]);
    } else {
      // Otherwise, select all
      setSelectedCategories(filteredCategories.map(cat => cat.id));
    }
  };

  const isAllSelected = filteredCategories.length > 0 && 
                        selectedCategories.length === filteredCategories.length;

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
              <h1 className="text-3xl font-bold tracking-tight">
                Manage Categories
              </h1>
              <p className="text-muted-foreground">
                Add, edit and manage your menu categories
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectionMode ? (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      if (selectedCategories.length > 0) {
                        setBatchDeleteDialogOpen(true);
                      } else {
                        toast.error("No categories selected");
                      }
                    }}
                    disabled={selectedCategories.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedCategories.length})
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
                  <Button
                    variant="outline"
                    onClick={() => setImportDialogOpen(true)}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Import from Excel
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentCategory(undefined);
                      setAddEditDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Category
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
                  placeholder="Search categories..."
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
                {selectionMode && filteredCategories.length > 0 && (
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
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="min-h-[300px]">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <div className="text-destructive mb-4">
                  <AlertTriangle className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-xl font-bold">{error}</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  There was a problem loading the categories. Please try again
                  or contact support.
                </p>
                <Button className="mt-4" onClick={fetchData}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Filter className="h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold">No categories found</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  {searchQuery
                    ? "Try adjusting your search to see more results."
                    : "You haven't added any categories yet. Click 'Add New Category' to get started."}
                </p>
                {searchQuery && (
                  <Button className="mt-4" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredCategories.map((category, index) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      itemCount={getCategoryItemCount(category.id)}
                      delay={index * 0.05}
                      onEdit={(category) => {
                        setCurrentCategory(category);
                        setAddEditDialogOpen(true);
                      }}
                      onDelete={(category) => {
                        setCurrentCategory(category);
                        setDeleteDialogOpen(true);
                      }}
                      selectionMode={selectionMode}
                      isSelected={selectedCategories.includes(category.id)}
                      onSelect={handleSelectCategory}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <CategoryDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        onSubmit={handleAddEditCategory}
        category={currentCategory}
        title={currentCategory ? "Edit Category" : "Add New Category"}
        description={
          currentCategory
            ? "Update the information for this category."
            : "Add a new category to your menu."
        }
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCategoryConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        category={currentCategory}
        onConfirm={handleDeleteCategory}
        itemCount={
          currentCategory ? getCategoryItemCount(currentCategory.id) : 0
        }
      />

      {/* Batch Delete Confirmation Dialog */}
      <DeleteCategoryConfirmDialog
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
        category={undefined}
        onConfirm={handleBatchDeleteCategories}
        itemCount={selectedCategories.reduce(
          (total, categoryId) => total + getCategoryItemCount(categoryId),
          0
        )}
        title="Delete Multiple Categories"
        description={`Are you sure you want to delete ${selectedCategories.length} categories? This action cannot be undone.`}
      />

      {/* Import Dialog */}
      <ImportCategoriesDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={handleImportComplete}
      />
    </AdminLayout>
  );
}
