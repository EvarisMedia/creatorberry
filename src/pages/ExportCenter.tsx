import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBrands } from "@/hooks/useBrands";
import { useProductOutlines } from "@/hooks/useProductOutlines";
import { useProductExports } from "@/hooks/useProductExports";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Loader2,
  FileDown,
  FileCode,
  FileType,
  Braces,
  Trash2,
  Clock,
  BookOpen,
  FileText,
  Download,
} from "lucide-react";

const formatOptions = [
  { value: "markdown", label: "Markdown", description: "Universal format, great for blogs and documentation", icon: FileDown, badge: "Popular" },
  { value: "html", label: "HTML", description: "Styled web page with professional formatting", icon: FileCode, badge: "Web" },
  { value: "pdf", label: "PDF", description: "Print-ready document, ideal for ebooks and handouts", icon: FileText, badge: "eBook" },
  { value: "docx", label: "Word Document", description: "Editable .docx file for Microsoft Word and Google Docs", icon: FileType, badge: "Editable" },
  { value: "epub", label: "ePub", description: "Standard ebook format for Kindle, Apple Books, and more", icon: BookOpen, badge: "eBook" },
  { value: "txt", label: "Plain Text", description: "Simple text format, compatible with any editor", icon: FileDown, badge: null },
  { value: "json", label: "JSON", description: "Structured data format for developers", icon: Braces, badge: "Dev" },
  { value: "csv", label: "CSV / Google Sheets", description: "Spreadsheet-ready format for Google Sheets and Excel", icon: FileDown, badge: "Sheets" },
];

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExportCenter() {
  const { currentBrand } = useBrands();
  const { outlines } = useProductOutlines(currentBrand?.id || null);
  const { exports, isLoading: exportsLoading, exportProduct, deleteExport, downloadExport } = useProductExports(currentBrand?.id);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [selectedOutline, setSelectedOutline] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("markdown");
  const [includeToc, setIncludeToc] = useState(true);

  const handleExport = () => {
    if (!selectedOutline) return;
    exportProduct.mutate({
      outlineId: selectedOutline,
      format: selectedFormat,
      settings: { includeToc },
    });
  };

  return (
    <AppLayout title="Export Center" subtitle="Export your products in multiple formats">
      <div className="p-6 space-y-6">
        {/* New Export */}
        <Card>
          <CardHeader>
            <CardTitle>Create Export</CardTitle>
            <CardDescription>Select a product outline and format to export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Product Outline</Label>
              <Select value={selectedOutline} onValueChange={setSelectedOutline}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an outline to export..." />
                </SelectTrigger>
                <SelectContent>
                  {outlines.map((outline) => (
                    <SelectItem key={outline.id} value={outline.id}>
                      {outline.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {outlines.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No outlines yet.{" "}
                  <Link to="/outlines" className="text-primary hover:underline">
                    Create one first
                  </Link>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {formatOptions.map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => setSelectedFormat(fmt.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedFormat === fmt.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <fmt.icon className="w-5 h-5 text-primary" />
                      <span className="font-medium text-sm">{fmt.label}</span>
                      {fmt.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {fmt.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{fmt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background">
              <Switch id="toc" checked={includeToc} onCheckedChange={setIncludeToc} />
              <Label htmlFor="toc" className="cursor-pointer">Include Table of Contents</Label>
            </div>

            <Button
              onClick={handleExport}
              disabled={!selectedOutline || exportProduct.isPending}
              className="w-full"
              size="lg"
            >
              {exportProduct.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Export...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export as {formatOptions.find((f) => f.value === selectedFormat)?.label}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle>Export History</CardTitle>
            <CardDescription>Your recent exports</CardDescription>
          </CardHeader>
          <CardContent>
            {exportsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : exports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileDown className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No exports yet. Create your first export above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {exports.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileDown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{exp.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {exp.format.toUpperCase()}
                          </Badge>
                          <span>{formatFileSize(exp.file_size)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(exp.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDownloadingId(exp.id);
                          downloadExport.mutate(exp, {
                            onSettled: () => setDownloadingId(null),
                          });
                        }}
                        disabled={downloadingId === exp.id}
                        className="text-muted-foreground hover:text-primary"
                        title="Download"
                      >
                        {downloadingId === exp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExport.mutate(exp.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
