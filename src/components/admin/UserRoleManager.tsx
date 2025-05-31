import { useState, useEffect } from "react";
import { authApi, UserRole } from "../../lib/api/user";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader2, UserCog } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: number;
  roleName: string;
}

export function UserRoleManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authApi.getAllUsers();
      setUsers(response);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (userId: string) => {
    const user = users.find((u) => u.id.toString() === userId);
    setSelectedUser(user || null);
    if (user) {
      setSelectedRole(user.roleName);
    }
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
  };

  const updateRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error("Please select both a user and a role");
      return;
    }

    try {
      const response = await authApi.updateUserRole(
        selectedUser.id, 
        selectedRole as UserRole
      );
      
      // Update local state with the updated user from the response
      setUsers(
        users.map((user) =>
          user.id === selectedUser.id ? response.user : user
        )
      );
      
      toast.success(`${selectedUser.name}'s role updated to ${response.user.roleName}`);
      
      // Update the selected user with the new data
      setSelectedUser(response.user);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Manage User Roles
        </CardTitle>
        <CardDescription>
          Assign roles to users to control their access and permissions
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="search-users">Search Users</Label>
            <Input
              id="search-users"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="select-user">Select User</Label>
                <Select
                  value={selectedUser?.id.toString() || ""}
                  onValueChange={handleUserChange}
                >
                  <SelectTrigger id="select-user">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email}) - {user.roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <div>
                  <Label htmlFor="select-role">Select Role</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger id="select-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="chef">Chef</SelectItem>
                      <SelectItem value="waiter">Waiter</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="pos-admin">POS Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={updateRole}
                disabled={!selectedUser || !selectedRole || selectedUser.roleName === selectedRole}
                className="w-full"
              >
                Update Role
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 