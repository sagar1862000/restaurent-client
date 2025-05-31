import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Button } from "../ui/button";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { authApi, getRoleName } from "../../lib/api";
import { getAllMenuItems } from "../../types/sidebarItems";

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  path: string;
  isExpanded: boolean;
  isActive: boolean;
  disabled?: boolean;
}

const SidebarItem = ({
  icon,
  title,
  path,
  isExpanded,
  isActive,
  disabled = false,
}: SidebarItemProps) => {
  return (
    <Link to={disabled ? "#" : path} onClick={(e) => disabled && e.preventDefault()}>
      <motion.div
        className={cn(
          "flex items-center gap-2 px-3 py-2 my-1 rounded-lg transition-all",
          isActive
            ? "bg-primary text-primary-foreground"
            : disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-accent/50 text-foreground/80 hover:text-foreground"
        )}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        layout
      >
        <span className="text-lg">{icon}</span>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
};

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
}

export function Sidebar({ isExpanded, setIsExpanded }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAuthenticated, userRole } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<any>([]);

  useEffect(() => {
    // Fetch user profile when the component mounts
    if (isAuthenticated) {
      const fetchUserProfile = async () => {
        try {
          const userData = await authApi.getMe();
          setUserProfile(userData);
          // Sort menu items with enabled items at top
          const items = getAllMenuItems();
          const sortedItems = items.sort((a, b) => {
            const aEnabled = userRole !== null && a.roles.includes(userRole);
            const bEnabled = userRole !== null && b.roles.includes(userRole);
            if (aEnabled === bEnabled) return 0;
            return aEnabled ? -1 : 1;
          });
          setMenuItems(sortedItems);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, userRole]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  if (loading) {
    return (
      <motion.aside
        layout
        className={cn(
          "h-screen bg-gradient-to-b from-background via-background to-accent/10 border-r fixed left-0 top-0 z-40",
          isExpanded ? "w-64" : "w-16"
        )}
      >
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      </motion.aside>
    );
  }

  // Format role name for display
  const displayRoleName = userRole !== null ? getRoleName(userRole) : "Guest";

  return (
    <motion.aside
      layout
      className={cn(
        "h-screen bg-gradient-to-b from-background via-background to-accent/10 border-r fixed left-0 top-0 z-40",
        isExpanded ? "w-64" : "w-16"
      )}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
    >
      <div className="h-full flex flex-col">
        <motion.div
          layout
          className="p-4 flex items-center justify-between border-b"
        >
          <motion.div
            className="flex items-center gap-2 overflow-hidden"
            layout
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              <img src="/logo.png" alt="logo" className="h-full w-full" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold overflow-hidden whitespace-nowrap"
                >
                  SkyBar Cafe & Lounge
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={toggleSidebar}
          >
            {isExpanded ? (
              <ChevronLeft size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </Button>
        </motion.div>

        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {menuItems.map((item: any) => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                title={item.title}
                path={item.path}
                isExpanded={isExpanded}
                isActive={location.pathname === item.path}
                disabled={userRole !== null && !item.roles.includes(userRole)}
              />
            ))}
          </div>
        </nav>

        <motion.div layout className="p-4 border-t mt-auto">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-medium text-sm">
                  {userProfile?.name?.charAt(0) || "G"}
                </span>
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    <div className="text-sm font-medium">
                      {userProfile?.name || "Guest"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {userProfile?.email || ""}
                      <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-sm text-[10px] capitalize">
                        {displayRoleName}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isAuthenticated && (
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex items-center gap-2 text-muted-foreground justify-start px-2",
                  !isExpanded && "justify-center"
                )}
              >
                <LogOut size={16} />
                {isExpanded && <span>Logout</span>}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.aside>
  );
}
