import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { MenuItem, menuItemsApi } from "../../lib/api/menuItems";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Filter, Search, CheckCircle, XCircle, UtensilsCrossed, Clock, Utensils, Tag } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#4ade80", "#f87171", "#fb923c", "#60a5fa"];

export default function ChefDashboard() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAvailable, setFilterAvailable] = useState<boolean | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await menuItemsApi.getAll();
      setItems(response);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast({
        title: "Error",
        description: "Failed to load menu items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleItemAvailability = async (
    itemId: number,
    currentStatus: boolean
  ) => {
    try {
      setUpdatingItemId(itemId);
      await menuItemsApi.update(itemId, { isAvailable: !currentStatus });
      
      // Update the local state
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, isAvailable: !currentStatus } : item
        )
      );

      toast({
        title: "Success",
        description: `Item is now ${
          !currentStatus ? "available" : "unavailable"
        }.`,
      });
    } catch (error) {
      console.error("Failed to update item availability:", error);
      toast({
        title: "Error",
        description: "Failed to update item availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (item.category?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) || false);
    
    if (filterAvailable === null) {
      return matchesSearch;
    }
    
    return matchesSearch && item.isAvailable === filterAvailable;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterAvailable(null);
  };

  // Calculate dashboard metrics
  const totalItems = items.length;
  const availableItems = items.filter(item => item.isAvailable).length;
  const unavailableItems = totalItems - availableItems;
  const availabilityPercentage = totalItems > 0 
    ? Math.round((availableItems / totalItems) * 100) 
    : 0;

  // Data for charts
  const availabilityData = [
    { name: "Available", value: availableItems },
    { name: "Unavailable", value: unavailableItems },
  ];

  // Prepare prep time data
  const preparationTimeGroups = [
    { name: "Quick (<15 min)", range: [0, 15], count: 0 },
    { name: "Medium (15-30 min)", range: [15, 30], count: 0 },
    { name: "Long (>30 min)", range: [30, Infinity], count: 0 },
  ];
  
  items.forEach(item => {
    const prepTime = item.preparationTime || 0;
    for (const group of preparationTimeGroups) {
      if (prepTime >= group.range[0] && prepTime <= group.range[1]) {
        group.count++;
        break;
      }
    }
  });

  // Get top 5 categories by item count
  const categoryMap = new Map();
  items.forEach(item => {
    if (item.category?.name) {
      const categoryName = item.category.name;
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
    }
  });
  
  const categoryCountsData = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading menu items...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Chef Dashboard</h1>
            <p className="text-muted-foreground">Manage menu items and monitor availability</p>
          </div>
          <Button onClick={fetchItems} variant="outline" size="sm" className="gap-2">
            <Loader2 className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Dashboard metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-indigo-50 to-background">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">Total Items</CardTitle>
              <Utensils className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">Menu items total</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-background">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">Available</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableItems}</div>
              <p className="text-xs text-muted-foreground">Items ready to order</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-background">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">Unavailable</CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unavailableItems}</div>
              <p className="text-xs text-muted-foreground">Items not available</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-background">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">Availability</CardTitle>
              <UtensilsCrossed className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availabilityPercentage}%</div>
              <p className="text-xs text-muted-foreground">Of menu is available</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Availability Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Item Availability
              </CardTitle>
              <CardDescription>Available vs unavailable items</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={availabilityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#4ade80" />
                    <Cell fill="#f87171" />
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Items']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Preparation Time Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Preparation Time
              </CardTitle>
              <CardDescription>Items by preparation duration</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={preparationTimeGroups} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Items']} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
