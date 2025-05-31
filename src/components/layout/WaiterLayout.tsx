import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { motion } from "framer-motion";

interface WaiterLayoutProps {
  children: ReactNode;
}

export function WaiterLayout({ children }: WaiterLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        isExpanded={sidebarExpanded}
        setIsExpanded={setSidebarExpanded}
      />
      <motion.div 
        className={`flex-1 transition-all duration-300 ${sidebarExpanded ? "ml-64" : "ml-16"}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6 h-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
} 