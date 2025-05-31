import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./lib/AuthContext";
import { AuthGuard, GuestGuard } from "./lib/AuthGuard";
import { SocketProvider } from "./lib/SocketContext";
import { ReactNode } from "react";
import { useAuth, Role } from "./lib/AuthContext";
import NewUserPage from "./pages/newUser";

// POS Guard component for protecting POS routes
function PosGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, userRole } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow only ADMIN and POS_ADMIN to access POS
  if (userRole !== Role.ADMIN && userRole !== Role.POS_ADMIN) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Lazy load pages
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const MenuCardPage = lazy(() => import("./pages/MenuCardPage"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const CategoryPage = lazy(() => import("./pages/admin/CategoryPage"));
const ItemPage = lazy(() => import("./pages/admin/ItemPage"));
const TablePage = lazy(() => import("./pages/admin/TablePage"));
const ManageMenusPage = lazy(() => import("./pages/admin/ManageMenusPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const PosPage = lazy(() => import("./pages/admin/PosPage"));

// Chef pages
const ChefDashboard = lazy(() => import("./pages/chef/index"));
const ChefOrdersPage = lazy(() => import("./pages/chef/ChefOrdersPage"));

// Waiter pages
const WaiterDashboard = lazy(() => import("./pages/waiter/index"));
const WaiterOrdersPage = lazy(() => import("./pages/waiter/OrdersPage"));
const WaiterOrdersKOTPage = lazy(() => import("./pages/waiter/WaiterPage"));

// Loading component
const Loading = () => (
  <div className="min-h-screen flex justify-center items-center">
    <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Root path - AuthGuard will redirect based on role */}
              <Route
                path="/"
                element={
                  <AuthGuard>
                    <div>Loading...</div>
                  </AuthGuard>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <AuthGuard>
                    <Navigate to="/admin/dashboard" replace />
                  </AuthGuard>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AuthGuard>
                    <AdminDashboard />
                  </AuthGuard>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <AuthGuard>
                    <CategoryPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/admin/menus"
                element={
                  <AuthGuard>
                    <ManageMenusPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/admin/items"
                element={
                  <AuthGuard>
                    <ItemPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/admin/tables"
                element={
                  <AuthGuard>
                    <TablePage />
                  </AuthGuard>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AuthGuard>
                    <SettingsPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/posAdmin/pos"
                element={
                  <AuthGuard>
                    <PosGuard>
                      <PosPage />
                    </PosGuard>
                  </AuthGuard>
                }
              />

              {/* Chef routes - not using AuthGuard to prevent infinite update loop */}
              <Route path="/chef" element={<ChefDashboard />} />
              <Route path="/chef/orders" element={<ChefOrdersPage />} />

              {/* Waiter routes - not using AuthGuard to prevent infinite update loop */}
              <Route path="/waiter" element={<WaiterDashboard />} />
              <Route path="/waiter/orders" element={<WaiterOrdersPage />} />
              <Route path="/waiter/ordersKOT" element={<WaiterOrdersKOTPage />} />
              {/* Guest routes */}
              <Route
                path="/login"
                element={
                  <GuestGuard>
                    <LoginPage />
                  </GuestGuard>
                }
              />
              <Route
                path="/signup"
                element={
                  <GuestGuard>
                    <SignupPage />
                  </GuestGuard>
                }
              />
              <Route
                path="/newUser"
                element={
                  <GuestGuard>
                    <NewUserPage />
                  </GuestGuard>
                }
              />
              {/* Public Menu Card Route - accessible by QR code */}
              <Route path="/table/:tableNumber" element={<MenuCardPage />} />

              {/* Redirect any other route to root for processing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
