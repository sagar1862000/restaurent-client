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
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../../lib/api/categories";
import ImagePreview from "../ImagePreview";
import { useToast } from "../ui/use-toast";
import { Loader2 } from "lucide-react";

// Form data type
type FormData = {
  name: string;
  description?: string;
  image?: File;
};

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCategoryPayload | UpdateCategoryPayload) => void;
  category?: Category;
  title?: string;
  description?: string;
}

export default function CategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  category,
  title,
  description,
}: CategoryDialogProps) {
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      image: undefined,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  // Update form values when category changes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        image: undefined,
      });
    } else {
      form.reset({
        name: "",
        image: undefined,
      });
    }
  }, [category, form]);

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

    try {
      setIsSubmitting(true);
      // Submit the form data
      const payload: CreateCategoryPayload = {
        name: values.name,
        description: values.description,
        image: values.image,
      };
      
      await onSubmit(payload);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to save category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpdate = !!category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {title || (isUpdate ? "Edit Category" : "Add Category")}
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
                    <Input placeholder="Category name" {...field} />
                  </FormControl>
                  <FormMessage />
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
                        <p className="text-xs text-gray-400 mt-1">
                          Max recommended size: 5MB (larger images will be compressed)
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
                      {category?.imageUrl && !image && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 mb-2">
                            Current image:
                          </p>
                          <img
                            src={category.imageUrl}
                            alt={category.name}
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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