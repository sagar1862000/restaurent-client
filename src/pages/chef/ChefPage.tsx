import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, CheckCircle, XCircle } from "lucide-react";
import { MenuItem, menuItemsApi } from "../../lib/api/menuItems";
import { Category, categoriesApi } from "../../lib/api/categories";
import { toast } from "sonner";

// Components
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";

export default function ChefPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [itemsData, categoriesData] = await Promise.all([
          menuItemsApi.getAll(),
          categoriesApi.getAll(),
        ]);

        setItems(itemsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load menu items");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter items based on search and filters
  const filteredItems = items.filter((item) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);

    // Category filter
    const matchesCategory =
      categoryFilter === "all" || item.categoryId.toString() === categoryFilter;

    // Availability filter
    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && item.isAvailable) ||
      (availabilityFilter === "unavailable" && !item.isAvailable);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i
        )
      );

      // Update in the backend
      await menuItemsApi.update(item.id, { isAvailable: !item.isAvailable });

      toast.success(
        `${item.name} is now ${!item.isAvailable ? "available" : "unavailable"}`
      );
    } catch (error) {
      // Revert the state change if the API call fails
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id ? { ...i, isAvailable: item.isAvailable } : i
        )
      );
      toast.error("Failed to update item availability");
      console.error("Error updating item:", error);
    }
  };

  // UI animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container max-w-7xl mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Chef Dashboard</h1>
          <p className="text-muted-foreground">Manage menu item availability</p>
        </header>

        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start mb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4 border-t">
                  <div>
                    <Label className="text-sm font-medium mb-1 block">
                      Category
                    </Label>
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-1 block">
                      Availability
                    </Label>
                    <Select
                      value={availabilityFilter}
                      onValueChange={setAvailabilityFilter}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="available">
                          Available Items
                        </SelectItem>
                        <SelectItem value="unavailable">
                          Unavailable Items
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary rounded-full"></div>
          </div>
        ) : (
          <div>
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/10">
                <p className="text-lg text-muted-foreground">No items found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try changing your search or filters
                </p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredItems.map((item) => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <Card className="overflow-hidden h-full flex flex-col">
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No image
                          </div>
                        )}

                        <div className="absolute top-3 right-3">
                          <Badge
                            variant={
                              item.isAvailable ? "default" : "destructive"
                            }
                          >
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                      </div>

                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{item.name}</CardTitle>
                          <div className="text-lg font-semibold">
                          ${Number(item.fullPrice).toFixed(2)}
                          </div>
                        </div>

                        <CardDescription className="line-clamp-2">
                          {item.description || "No description"}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pb-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {categories.find((c) => c.id === item.categoryId)
                              ?.name || "Uncategorized"}
                          </Badge>
                          {item.preparationTime > 0 && (
                            <Badge variant="outline">
                              {item.preparationTime} mins
                            </Badge>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="pt-2 mt-auto">
                        <div className="flex w-full items-center justify-between">
                          <Label htmlFor={`availability-${item.id}`}>
                            Toggle availability
                          </Label>
                          <div className="flex items-center gap-2">
                            {item.isAvailable ? (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <Switch
                              id={`availability-${item.id}`}
                              checked={item.isAvailable}
                              onCheckedChange={() =>
                                handleToggleAvailability(item)
                              }
                            />
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
