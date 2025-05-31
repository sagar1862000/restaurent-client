import { useRef } from "react";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Table } from "../../lib/api/tables";

interface QRCodeTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | undefined;
}

export function QRCodeTemplateDialog({
  open,
  onOpenChange,
  table,
}: QRCodeTemplateDialogProps) {
  const qrTemplateRef = useRef<HTMLDivElement>(null);

  if (!table) return null;

  const handleDownloadImage = async () => {
    if (!qrTemplateRef.current) return;

    try {
      const canvas = await html2canvas(qrTemplateRef.current, {
        scale: 3,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = imgData;
      link.download = `table-${table.tableNumber}-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onOpenChange(false);
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] overflow-y-auto">
        <div className="grid grid-cols-1 gap-6 py-4">
          <div className="border-t">
            <Label className="block text-sm font-medium">Preview</Label>
            <div
              className="aspect-square w-full max-w-[200px] h-[200px] mx-auto"
              ref={qrTemplateRef}
            >
              {/* QR Code */}
              <div className="flex items-center flex-col justify-center w-full">
                <div
                  className="bg-white rounded-md flex items-center justify-center overflow-hidden"
                  style={{
                    width: "200px",
                    height: "200px",
                  }}
                >
                  <img
                    src={table.qrCodeUrl}
                    alt={`QR Code for Table ${table.tableNumber}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
                <div className="text-center font-bold -mt-8 tracking-wider uppercase">
                  Table : {table.tableNumber}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDownloadImage}>Download Image</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
