import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { itemsApi, ImportItemsResult } from "../../lib/api/items";
import { AlertCircle, Check, Download, FileSpreadsheet, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface ImportItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export default function ImportItemsDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ImportItemsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportItemsResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      // Check if it's an Excel file
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to import",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await itemsApi.importFromExcel(file);
      setImportResult(result);
      
      if (result.results.success > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.results.success} items`,
        });
        onImportComplete();
      } else {
        toast({
          title: "Import Completed",
          description: "No items were imported",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "There was an error importing the items",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setImportResult(null);
  };

  const handleDownloadTemplate = () => {
    try {
      itemsApi.downloadExcelTemplate();
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error downloading the template",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Items from Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="text-sm text-muted-foreground">
            <p>Upload an Excel file (.xlsx or .xls) with the following columns:</p>
            <ul className="list-disc pl-5 mt-2">
              <li><strong>name</strong> (required) - Item name</li>
              <li><strong>fullPrice</strong> (required) - Full price of the item</li>
              <li><strong>category</strong> (required) - Category name (must match an existing category)</li>
              <li><strong>halfPrice</strong> (optional) - Half price of the item</li>
              <li><strong>preparationTime</strong> (optional) - Preparation time in minutes</li>
              <li><strong>imageUrl</strong> (optional) - URL to the item image</li>
              <li><strong>subcategory</strong> (optional) - Subcategory name</li>
              <li><strong>tags</strong> (optional) - Comma-separated or JSON array of tags</li>
              <li><strong>description</strong> (optional) - Item description</li>
            </ul>
            <div className="mt-2">
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-blue-500 flex items-center"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-3 w-3 mr-1" />
                Download Template
              </Button>
            </div>
          </div>

          {importResult ? (
            <div className="space-y-4">
              <Alert className={importResult.results.success > 0 ? "bg-green-50" : "bg-yellow-50"}>
                <Check className={`h-4 w-4 ${importResult.results.success > 0 ? "text-green-600" : "text-yellow-600"}`} />
                <AlertTitle>Import Completed</AlertTitle>
                <AlertDescription>
                  <ul className="list-none mt-2">
                    <li>Successfully imported: {importResult.results.success}</li>
                    <li>Failed imports: {importResult.results.failed}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {importResult.results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Errors</AlertTitle>
                  <AlertDescription className="max-h-[200px] overflow-y-auto">
                    <ul className="list-disc pl-5 mt-2">
                      {importResult.results.errors.map((error, index) => (
                        <li key={index}>
                          Row {error.row}: {error.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button onClick={resetForm} variant="outline">
                  Import Another File
                </Button>
                <Button onClick={() => onOpenChange(false)}>Close</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center justify-center gap-2">
                  <FileSpreadsheet className="h-10 w-10 text-gray-400" />
                  <label className="cursor-pointer text-center">
                    <span className="text-sm text-gray-500">
                      {file ? file.name : "Drop your Excel file here, or click to browse"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                    />
                  </label>
                  {file && (
                    <span className="text-xs text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!file || isUploading}
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Items
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 