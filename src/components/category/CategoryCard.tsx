import { motion } from "framer-motion";
import { Edit, Trash2, ShoppingBag, MoreVertical } from "lucide-react";
import { Card, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Category } from "../../lib/api/categories";

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  itemCount?: number;
  delay?: number;
  isSelected?: boolean;
  onSelect?: (category: Category, isSelected: boolean) => void;
  selectionMode?: boolean;
}

export function CategoryCard({ 
  category, 
  onEdit, 
  onDelete, 
  itemCount = 0,
  delay = 0,
  isSelected = false,
  onSelect,
  selectionMode = false
}: CategoryCardProps) {
  const defaultImage = "https://placehold.co/600x400/115e59/e0f2f1?text=Category";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card 
        className={`h-full flex flex-col overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          {selectionMode && (
            <div className="absolute top-2 left-2 z-10">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={(checked) => onSelect?.(category, !!checked)}
                className="h-5 w-5 bg-white/90 border-transparent"
              />
            </div>
          )}
          
          <img
            src={category.imageUrl || defaultImage}
            alt={category.name}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
            onClick={() => selectionMode && onSelect?.(category, !isSelected)}
            style={{ cursor: selectionMode ? 'pointer' : 'default' }}
          />
          
          <div className="absolute top-2 right-2 flex gap-1">
            <Badge variant="secondary" className="backdrop-blur-sm bg-secondary/80">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Badge>
            
            {!selectionMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full backdrop-blur-sm bg-secondary/80">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(category)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(category)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4"
            onClick={() => selectionMode && onSelect?.(category, !isSelected)}
            style={{ cursor: selectionMode ? 'pointer' : 'default' }}
          >
            <div className="space-y-1">
              <h3 className="font-bold text-white truncate">{category.name}</h3>
            </div>
          </div>
        </div>

        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex items-center text-xs text-muted-foreground">
            <ShoppingBag className="w-3 h-3 mr-1" />
            {itemCount} {itemCount === 1 ? 'menu item' : 'menu items'}
          </div>
          
          {!selectionMode && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
} 