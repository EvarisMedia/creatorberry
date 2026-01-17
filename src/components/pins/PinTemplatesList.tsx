import { useState } from "react";
import {
  Layout,
  MoreHorizontal,
  Star,
  StarOff,
  Trash2,
  Edit,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { PinTemplate, usePinTemplates, CreatePinTemplateInput } from "@/hooks/usePinTemplates";
import { PinTemplateDialog } from "./PinTemplateDialog";

interface PinTemplatesListProps {
  brandId: string | null;
  onSelectTemplate?: (template: PinTemplate) => void;
  selectable?: boolean;
}

export function PinTemplatesList({ 
  brandId, 
  onSelectTemplate,
  selectable = false 
}: PinTemplatesListProps) {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, setDefaultTemplate } = usePinTemplates(brandId);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PinTemplate | null>(null);

  const handleCreate = async (data: CreatePinTemplateInput) => {
    await createTemplate.mutateAsync(data);
  };

  const handleUpdate = async (data: CreatePinTemplateInput) => {
    if (!editingTemplate) return;
    await updateTemplate.mutateAsync({ id: editingTemplate.id, ...data });
    setEditingTemplate(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteTemplate.mutateAsync(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const handleDuplicate = async (template: PinTemplate) => {
    await createTemplate.mutateAsync({
      brand_id: template.brand_id || undefined,
      name: `${template.name} (Copy)`,
      description: template.description || undefined,
      pin_type: template.pin_type || undefined,
      title_template: template.title_template || undefined,
      description_template: template.description_template || undefined,
      headline_template: template.headline_template || undefined,
      cta_type: template.cta_type || undefined,
      layout_style: template.layout_style || undefined,
      color_emphasis: template.color_emphasis || undefined,
      keywords: template.keywords || undefined,
      is_default: false,
    });
  };

  const handleSetDefault = async (templateId: string) => {
    await setDefaultTemplate.mutateAsync({ templateId, brandId });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pin Templates</h3>
          <p className="text-sm text-muted-foreground">
            Save and reuse pin layouts, styles, and copy structures
          </p>
        </div>
        <PinTemplateDialog brandId={brandId} onSave={handleCreate} />
      </div>

      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Layout className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No templates yet</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create templates to save time when generating pins. Include layouts, styles, and copy structures.
            </p>
            <PinTemplateDialog 
              brandId={brandId} 
              onSave={handleCreate}
              trigger={
                <Button>
                  <Layout className="mr-2 h-4 w-4" />
                  Create Your First Template
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className={`relative group ${selectable ? 'cursor-pointer hover:border-primary' : ''}`}
              onClick={selectable ? () => onSelectTemplate?.(template) : undefined}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  {!selectable && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetDefault(template.id)}>
                          {template.is_default ? (
                            <>
                              <StarOff className="h-4 w-4 mr-2" />
                              Remove Default
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Set as Default
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteConfirmId(template.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {template.pin_type && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {template.pin_type}
                    </Badge>
                  )}
                  {template.layout_style && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {template.layout_style}
                    </Badge>
                  )}
                  {template.cta_type && (
                    <Badge variant="outline" className="text-xs capitalize">
                      CTA: {template.cta_type}
                    </Badge>
                  )}
                  {template.color_emphasis && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {template.color_emphasis}
                    </Badge>
                  )}
                </div>

                {template.title_template && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Title Template</p>
                    <p className="text-sm truncate">{template.title_template}</p>
                  </div>
                )}

                {template.headline_template && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Headline</p>
                    <p className="text-sm truncate">{template.headline_template}</p>
                  </div>
                )}

                {template.keywords && template.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.keywords.slice(0, 3).map((keyword, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                    {template.keywords.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{template.keywords.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingTemplate && (
        <PinTemplateDialog
          brandId={brandId}
          template={editingTemplate}
          onSave={handleUpdate}
          trigger={<span />}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The template will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}