import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Category } from "../../lib/api/categories";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  CreateMenuItemPayload,
  MenuItem,
  UpdateMenuItemPayload,
} from "../../lib/api/menuItems";
import ImagePreview from "../ImagePreview";
import { useToast } from "../ui/use-toast";
import { Badge } from "../ui/badge";
import { X, Plus, Loader2 } from "lucide-react";

// Form data type
type FormData = {
  name: string;
  description?: string;
  fullPrice: string;
  halfPrice?: string;
  preparationTime: string;
  isAvailable: boolean;
  categoryId: string;
  subcategory?: string;
  tags?: string[];
  image?: File;
};

// Common subcategory examples
const SUBCATEGORY_SUGGESTIONS = [
  "Hot", "Cold", "Spicy", "Mild", "Sweet", "Sour", "Vegan"
];

// Common tags examples
const TAG_SUGGESTIONS = [
  "Veg", "Non-Veg", "Gluten-Free", "Dairy-Free", "Spicy", "Chef's Special", 
  "Popular", "New", "Seasonal", "Organic", "Low-Calorie", "Signature"
];

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateMenuItemPayload | UpdateMenuItemPayload) => void;
  categories: Category[];
  menuItem?: MenuItem;
  title?: string;
  description?: string;
}

export default function MenuItemDialog({
  open,
  onOpenChange,
  onSubmit,
  categories,
  menuItem,
  title,
  description,
}: MenuItemDialogProps) {
  const [tagInput, setTagInput] = useState("");
  const [subcategorySuggestions, setSubcategorySuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHalfPrice, setShowHalfPrice] = useState(!!menuItem?.halfPrice);
  
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      fullPrice: "0",
      halfPrice: "",
      preparationTime: "0",
      isAvailable: true,
      categoryId: "",
      subcategory: "",
      tags: [],
      image: undefined,
    },
  });

  const { toast } = useToast();
  const tags = form.watch("tags") || [];
  const subcategory = form.watch("subcategory") || "";

  // Update form values when menuItem changes
  useEffect(() => {
    if (menuItem) {
      form.reset({
        name: menuItem.name,
        description: menuItem.description,
        fullPrice: menuItem.fullPrice.toString(),
        halfPrice: menuItem.halfPrice?.toString() || "",
        preparationTime: menuItem.preparationTime.toString(),
        isAvailable: menuItem.isAvailable,
        categoryId: menuItem.categoryId.toString(),
        subcategory: menuItem.subcategory || "",
        tags: menuItem.tags || [],
        image: undefined,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        fullPrice: "0",
        halfPrice: "",
        preparationTime: "0",
        isAvailable: true,
        categoryId: "",
        subcategory: "",
        tags: [],
        image: undefined,
      });
    }
  }, [menuItem, form]);

  // Filter subcategory suggestions based on input
  useEffect(() => {
    if (subcategory) {
      const filteredSuggestions = SUBCATEGORY_SUGGESTIONS.filter(
        suggestion => suggestion.toLowerCase().includes(subcategory.toLowerCase())
      );
      setSubcategorySuggestions(filteredSuggestions);
    } else {
      setSubcategorySuggestions(SUBCATEGORY_SUGGESTIONS);
    }
  }, [subcategory]);

  // Dropzone for image upload
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.length) {
        // Check file size
        const file = acceptedFiles[0];
        const fileSizeMB = file.size / (1024 * 1024);
        
        if (fileSizeMB > 5) {
          toast({
            title: "Image size warning",
            description: "Large image detected. It will be compressed for better performance.",
            duration: 3000,
          });
        }
        
        form.setValue("image", file);
      }
    },
  });

  const image = form.watch("image");

  // Add tag function
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      form.setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // Remove tag function
  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  // Set subcategory from suggestions
  const selectSubcategory = (value: string) => {
    form.setValue("subcategory", value);
    setSubcategorySuggestions([]);
  };

  // Add tag from suggestions
  const addTagFromSuggestion = (tag: string) => {
    if (!tags.includes(tag)) {
      form.setValue("tags", [...tags, tag]);
    }
  };

  const handleSubmit = async (values: FormData) => {
    // Validate required fields
    if (!values.name) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!values.fullPrice) {
      toast({
        title: "Error",
        description: "Full price is required",
        variant: "destructive",
      });
      return;
    }

    if (!values.preparationTime) {
      toast({
        title: "Error",
        description: "Preparation time is required",
        variant: "destructive",
      });
      return;
    }

    if (!values.categoryId) {
      toast({
        title: "Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Show toast if image is being uploaded
      if (values.image) {
        toast({
          title: "Processing image",
          description: "Your image is being processed and uploaded. This may take a moment.",
          duration: 3000,
        });
      }
      
      // Transform the values from the form to match the menu item payload
      const payload: CreateMenuItemPayload = {
        name: values.name,
        description: values.description || "",
        fullPrice: parseFloat(values.fullPrice),
        halfPrice: values.halfPrice ? parseFloat(values.halfPrice) : undefined,
        preparationTime: parseInt(values.preparationTime, 10),
        isAvailable: values.isAvailable,
        categoryId: parseInt(values.categoryId, 10),
        subcategory: values.subcategory || undefined,
        tags: values.tags || [],
        image: values.image,
      };
      
      await onSubmit(payload);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to save menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpdate = !!menuItem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {title || (isUpdate ? "Edit Menu Item" : "Add Menu Item")}
          </DialogTitle>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Item description"
                      className="resize-none max-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isUpdate && !menuItem?.halfPrice ? " Price (₹)" : "Full Price (₹)"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem className="flex flex-row items-center justify-between rounded-lg mt-6 shadow-sm">
                <div className="">
                  <FormLabel>Add Half Price</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={showHalfPrice}
                    onCheckedChange={(checked) => {
                      setShowHalfPrice(checked);
                      if (!checked) {
                        form.setValue("halfPrice", "");
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            </div>

            {showHalfPrice && (
              <FormField
                control={form.control}
                name="halfPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Half Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="preparationTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preparation Time (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory (optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="e.g., Hot, Cold, Spicy" 
                        {...field} 
                        value={field.value || ""} 
                      />
                      {subcategory && subcategorySuggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                          <div className="py-1">
                            {subcategorySuggestions.map((suggestion) => (
                              <div
                                key={suggestion}
                                className="px-4 py-2 hover:bg-muted cursor-pointer"
                                onClick={() => selectSubcategory(suggestion)}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <p className="text-sm text-muted-foreground mt-1">
                    Common: 
                    {SUBCATEGORY_SUGGESTIONS.slice(0, 5).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="inline-block ml-1 text-primary hover:underline"
                        onClick={() => selectSubcategory(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>Tags (optional)</FormLabel>
                  <FormControl>
                    <div>
                      <div className="flex items-center">
                        <Input
                          placeholder="Add tags (e.g., Veg, Spicy)"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2"
                          onClick={addTag}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="px-2 py-1">
                            {tag}
                            <button
                              type="button"
                              className="ml-1 hover:text-destructive"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">Common tags:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {TAG_SUGGESTIONS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              className={`text-xs px-2 py-1 border rounded-full hover:bg-muted transition-colors ${
                                tags.includes(tag) ? 'bg-primary text-primary-foreground' : 'border-input'
                              }`}
                              onClick={() => addTagFromSuggestion(tag)}
                              disabled={tags.includes(tag)}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Available</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <div>
                      <div
                        {...getRootProps({
                          className:
                            "border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 transition-colors",
                        })}
                      >
                        <input {...getInputProps()} />
                        <p className="text-sm text-gray-500">
                          Drag and drop an image here, or click to select
                        </p>
                      </div>
                      {image && (
                        <div className="mt-4">
                          <ImagePreview
                            file={image as File}
                            onRemove={() => form.setValue("image", undefined)}
                          />
                        </div>
                      )}
                      {menuItem?.imageUrl && !image && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 mb-2">
                            Current image:
                          </p>
                          <img
                            src={menuItem.imageUrl}
                            alt={menuItem.name}
                            className="w-full h-auto max-h-[160px] object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUpdate ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isUpdate ? "Update" : "Create"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 