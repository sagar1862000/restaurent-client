import { X } from "lucide-react";
import { Button } from "./ui/button";

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
}

export default function ImagePreview({ file, onRemove }: ImagePreviewProps) {
  const imageUrl = URL.createObjectURL(file);

  return (
    <div className="relative rounded-md overflow-hidden">
      <img 
        src={imageUrl} 
        alt={file.name} 
        className="w-full h-auto max-h-[160px] object-cover rounded-md"
      />
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
} 