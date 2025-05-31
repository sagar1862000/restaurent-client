import { AdminLayout } from "../../components/layout/AdminLayout";
import { UserRoleManager } from "../../components/admin/UserRoleManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings.</p>
        </div>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="general">General Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            <UserRoleManager />
          </TabsContent>
          
          <TabsContent value="general">
            <div className="border rounded-lg p-8 flex items-center justify-center min-h-[300px]">
              <p className="text-muted-foreground">General settings will be implemented here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 