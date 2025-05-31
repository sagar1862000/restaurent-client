import { motion } from "framer-motion";
import { Clock, Edit, Trash2, Tag, MoreVertical, Hash } from "lucide-react";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MenuItem } from "../../lib/api/menuItems";
import { formatPrice, getItemPrice } from "../../lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  delay?: number;
  isSelected?: boolean;
  onSelect?: (item: MenuItem, isSelected: boolean) => void;
  selectionMode?: boolean;
}

export function MenuItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  delay = 0,
  isSelected = false,
  onSelect,
  selectionMode = false
}: MenuItemCardProps) {
  const defaultImage = "https://placehold.co/600x400/213555/e0f4ff?text=No+Image";
  
  // Ensure preparation time is a number
  const formatPrepTime = (time: any): number => {
    const numTime = typeof time === 'number' ? time : parseInt(time);
    return isNaN(numTime) ? 0 : numTime;
  };
  
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
        className={`h-full flex flex-col overflow-hidden transition-all ${!item.isAvailable ? 'opacity-70' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          {selectionMode && (
            <div className="absolute top-2 left-2 z-10">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={(checked) => onSelect?.(item, !!checked)}
                className="h-5 w-5 bg-white/90 border-transparent"
              />
            </div>
          )}
          
          <img
            src={item.imageUrl || defaultImage}
            alt={item.name}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
            onClick={() => selectionMode && onSelect?.(item, !isSelected)}
            style={{ cursor: selectionMode ? 'pointer' : 'default' }}
          />
          
          <div className="absolute top-2 right-2 flex gap-1">
            {!item.isAvailable && (
              <Badge variant="destructive" className="backdrop-blur-sm bg-destructive/90">
                Unavailable
              </Badge>
            )}
            
            {/* Display first tag as badge if available */}
            {item.tags && item.tags.length > 0 && (
              <Badge variant="secondary" className="backdrop-blur-sm bg-secondary/80">
                {item.tags[0]}
              </Badge>
            )}
            
            {!selectionMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full backdrop-blur-sm bg-secondary/80">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4"
            onClick={() => selectionMode && onSelect?.(item, !isSelected)}
            style={{ cursor: selectionMode ? 'pointer' : 'default' }}
          >
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <h3 className="font-bold text-white truncate">{item.name}</h3>
                <div className="flex items-center flex-wrap gap-1">
                  {item.category && (
                    <div className="flex items-center text-white/80 text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {item.category.name}
                    </div>
                  )}
                  {item.subcategory && (
                    <div className="flex items-center text-white/80 text-xs ml-2">
                      <Hash className="w-3 h-3 mr-1" />
                      {item.subcategory}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-white font-bold text-lg">
                {formatPrice(getItemPrice(item))}
              </div>
            </div>
          </div>
        </div>

        <CardContent 
          className="flex-1 p-4"
          onClick={() => selectionMode && onSelect?.(item, !isSelected)}
          style={{ cursor: selectionMode ? 'pointer' : 'default' }}
        >
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.description || "No description available"}
          </p>
          
          {/* Display tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {formatPrepTime(item.preparationTime)} min prep time
          </div>
          
          {!selectionMode && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
} 