import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  Download
} from "lucide-react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { Skeleton } from "../../components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, tablesApi } from "../../lib/api/tables";
import { Menu, menusApi } from "../../lib/api/menus";
import TableDialog from "../../components/tables/TableDialog";
import { DeleteTableDialog } from "../../components/tables/DeleteTableDialog";
import { QRCodeTemplateDialog } from "../../components/tables/QRCodeTemplateDialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

export default function TablePage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrTemplateDialogOpen, setQrTemplateDialogOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState<Table | undefined>(undefined);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMenu, setSelectedMenu] = useState<string>("all");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Fetch tables and menus
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tablesData, menusData] = await Promise.all([
        tablesApi.getAll(),
        menusApi.getAll(),
      ]);
      
      console.log("Tables data:", tablesData);
      console.log("Menus data:", menusData);
      
      setTables(tablesData);
      setMenus(menusData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load tables. Please try again.");
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle add/edit table
  const handleAddEditTable = async (formData: any) => {
    try {
      const data = {
        tableNumber: parseInt(formData.tableNumber),
        location: formData.location,
        menuId: parseInt(formData.menuId),
      };

      if (currentTable) {
        // Update existing table
        const updatedTable = await tablesApi.update(currentTable.id, data);
        setTables((prev) =>
          prev.map((table) =>
            table.id === currentTable.id ? updatedTable : table
          )
        );
        toast.success("Table updated successfully");
      } else {
        // Create new table
        const newTable = await tablesApi.create(data);
        setTables((prev) => [...prev, newTable]);
        toast.success("Table created successfully");
      }
    } catch (error) {
      console.error("Error saving table:", error);
      toast.error(currentTable ? "Failed to update table" : "Failed to create table");
      throw error;
    }
  };

  // Handle delete table
  const handleDeleteTable = async () => {
    if (!currentTable) return;
    try {
      await tablesApi.delete(currentTable.id);
      setTables(prev => prev.filter(table => table.id !== currentTable.id));
      toast.success("Table deleted successfully");
    } catch (error) {
      console.error("Error deleting table:", error);
      toast.error("Failed to delete table");
      throw error;
    }
  };

  // Download QR code
  const handleDownloadQR = (table: Table) => {
    // Open the QR code template dialog with the current table
    setCurrentTable(table);
    setQrTemplateDialogOpen(true);
  };

  // Filter tables
  const filteredTables = tables.filter((table) => {
    const matchesSearch = 
      table.tableNumber.toString().includes(searchQuery) ||
      (table.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (table.menuName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    // Convert menuId to string for comparison
    const tableMenuId = String(table.menuId);
    const matchesMenu = selectedMenu === "all" || tableMenuId === selectedMenu;
    
    // Debug log
    if (selectedMenu !== "all" && matchesMenu) {
      console.log(`Matched table: ${table.id}, menuId: ${tableMenuId}`);
    }
    
    return matchesSearch && matchesMenu;
  });

  // Debug the filtered results
  useEffect(() => {
    if (selectedMenu !== "all") {
      console.log(`Selected menu: ${selectedMenu}, Found tables: ${filteredTables.length}`);
    }
  }, [selectedMenu, filteredTables.length]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Tables</h1>
              <p className="text-muted-foreground">Add, edit and manage your restaurant tables</p>
            </div>
            <Button onClick={() => {
              setCurrentTable(undefined);
              setAddEditDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Table
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
                  placeholder="Search tables..."
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
                  <div className="border-t p-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Menu</label>
                      <Select
                        value={selectedMenu}
                        onValueChange={(value) => {
                          console.log(`Menu selected: ${value}`);
                          setSelectedMenu(value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Menus" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Menus</SelectItem>
                          {menus.map((menu) => (
                            <SelectItem key={menu.id} value={String(menu.id)}>
                              {menu.name}
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
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg border overflow-hidden">
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <div className="border-t p-3">
                    <Skeleton className="h-8 w-full" />
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
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-10 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedMenu !== "all"
                  ? "No tables match your filters"
                  : "No tables available yet"}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentTable(undefined);
                  setAddEditDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add your first table
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredTables.map((table) => (
                  <Card key={table.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        Table #{table.tableNumber}
                        {table.location && <span className="text-sm font-normal ml-2 text-muted-foreground">({table.location})</span>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-col gap-2">
                        <div className="text-sm text-muted-foreground">
                          Menu: {table.menuName || table.menu?.name || "No Menu"}
                        </div>
                        <div className="aspect-square max-h-32 mx-auto">
                          <img 
                            src={table.qrCodeUrl} 
                            alt={`QR Code for Table ${table.tableNumber}`}
                            className="max-h-full mx-auto"
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="grid grid-cols-3 gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="col-span-1"
                        onClick={() => handleDownloadQR(table)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="col-span-1"
                        onClick={() => {
                          setCurrentTable(table);
                          setAddEditDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        className="col-span-1"
                        onClick={() => {
                          setCurrentTable(table);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Table Form Dialog */}
      <TableDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        onSubmit={handleAddEditTable}
        menus={menus}
        table={currentTable}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTableDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        table={currentTable}
        onConfirm={handleDeleteTable}
      />

      {/* QR Code Template Dialog */}
      <QRCodeTemplateDialog
        open={qrTemplateDialogOpen}
        onOpenChange={setQrTemplateDialogOpen}
        table={currentTable}
      />
    </AdminLayout>
  );
} 