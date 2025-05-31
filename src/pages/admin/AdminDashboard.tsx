import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { authApi } from "../../lib/api/user";
import { menuItemsApi } from "../../lib/api/menuItems";
import { tablesApi } from "../../lib/api/tables";
import { categoriesApi } from "../../lib/api/categories";
import {
  ChefHat,
  Users,
  Receipt,
  Utensils,
  Table,
  FileText,
  Loader2,
  Calculator,
  TrendingUp,
  Wallet,
  DollarSign,
  Printer
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";


interface User {
  id: number;
  name: string;
  email: string;
  role: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

// Sample order data (revenue by day)
const revenueData = [
  { day: "Mon", amount: 1200 },
  { day: "Tue", amount: 1800 },
  { day: "Wed", amount: 1400 },
  { day: "Thu", amount: 2000 },
  { day: "Fri", amount: 2400 },
  { day: "Sat", amount: 3200 },
  { day: "Sun", amount: 2800 },
];

// Sample order data by time of day
const ordersByTime = [
  { time: "6-9 AM", orders: 45 },
  { time: "9-12 PM", orders: 85 },
  { time: "12-3 PM", orders: 120 },
  { time: "3-6 PM", orders: 65 },
  { time: "6-9 PM", orders: 140 },
  { time: "9-12 AM", orders: 90 },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [usersData, itemsData, tablesData, categoriesData] = await Promise.all([
          authApi.getAllUsers(),
          menuItemsApi.getAll(),
          tablesApi.getAll(),
          categoriesApi.getAll(),
        ]);

        setUsers(usersData || []);
        setItems(itemsData || []);
        setTables(tablesData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate user stats
  const chefCount = users.filter(user => user.role === 1).length;
  const waiterCount = users.filter(user => user.role === 2).length;
  const adminCount = users.filter(user => user.role === 0).length;
  const customerCount = users.filter(user => user.role === 3).length;

  // Calculate item stats
  const availableItems = items.filter(item => item.isAvailable).length;
  const unavailableItems = items.length - availableItems;

  // Prepare data for pie chart
  const userRoleData = [
    { name: "Chefs", value: chefCount },
    { name: "Waiters", value: waiterCount },
    { name: "Admins", value: adminCount },
    { name: "Customers", value: customerCount },
  ].filter(item => item.value > 0);

  // Category distribution data
  const categoryItemsData = categories.map(category => ({
    name: category.name,
    items: items.filter(item => item.categoryId === category.id).length
  })).filter(category => category.items > 0);

  // Item availability data
  const availabilityData = [
    { name: "Available", value: availableItems },
    { name: "Unavailable", value: unavailableItems },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome to your administration dashboard.</p>
          </div>
          <div>
            <Button onClick={() => navigate("/waiter/ordersKOT")}>
              <Printer size={20} />
              Print KOT
            </Button>
          </div>
        </div>

        {/* Top Row Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-indigo-50 to-background">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-md font-medium">Chefs</CardTitle>
                <ChefHat className="h-5 w-5 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chefCount}</div>
                <p className="text-xs text-muted-foreground">Total chef staff</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-background">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-md font-medium">Waiters</CardTitle>
                <Users className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{waiterCount}</div>
                <p className="text-xs text-muted-foreground">Total waiter staff</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-amber-50 to-background">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-md font-medium">Items</CardTitle>
                <Utensils className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{items.length}</div>
                <p className="text-xs text-muted-foreground">Menu items total</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-rose-50 to-background">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-md font-medium">Tables</CardTitle>
                <Table className="h-5 w-5 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tables.length}</div>
                <p className="text-xs text-muted-foreground">Total restaurant tables</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Weekly Revenue
                </CardTitle>
                <CardDescription>Revenue trends for the past week</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Staff Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Staff Distribution
                </CardTitle>
                <CardDescription>Breakdown of staff by role</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {userRoleData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Orders by Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Order Distribution
                </CardTitle>
                <CardDescription>Orders by time of day</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Orders']} />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Categories
                </CardTitle>
                <CardDescription>Menu items by category</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryItemsData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={60} />
                    <Tooltip formatter={(value) => [value, 'Items']} />
                    <Bar dataKey="items" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Item Availability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  Item Availability
                </CardTitle>
                <CardDescription>Available vs unavailable items</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={availabilityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
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
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
} 