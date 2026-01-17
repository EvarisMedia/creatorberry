import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTrainingLibrary, TrainingItem, CreateTrainingItemInput } from "@/hooks/useTrainingLibrary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TrainingItemsList } from "@/components/training/TrainingItemsList";
import { AddTrainingItemDialog } from "@/components/training/AddTrainingItemDialog";
import { UploadTrainingDocumentDialog } from "@/components/training/UploadTrainingDocumentDialog";
import {
  LayoutDashboard,
  Users,
  Brain,
  LogOut,
  Plus,
  Upload,
  Lightbulb,
  FileText,
  BookOpen,
  Loader2,
  RefreshCw,
  Settings,
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Brain, label: "AI Training", href: "/admin/training" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export default function AdminTrainingLibrary() {
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin, isLoading: authLoading } = useAuth();
  const {
    trainingItems,
    itemsByCategory,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
    toggleActive,
    uploadDocument,
    regenerateEmbeddings,
    itemsMissingEmbeddings,
  } = useTrainingLibrary();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<TrainingItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSaveItem = async (input: CreateTrainingItemInput) => {
    if (editItem) {
      await updateItem.mutateAsync({
        id: editItem.id,
        ...input,
      });
    } else {
      await createItem.mutateAsync(input);
    }
    setAddDialogOpen(false);
    setEditItem(null);
  };

  const handleEdit = (item: TrainingItem) => {
    setEditItem(item);
    setAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteItemId) {
      await deleteItem.mutateAsync(deleteItemId);
      setDeleteItemId(null);
    }
  };

  const handleUpload = async (file: File) => {
    await uploadDocument.mutateAsync(file);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>

          <nav className="flex-1 px-4">
            {sidebarItems.map((item) => (
              <Button
                key={item.href}
                variant={item.href === "/admin/training" ? "secondary" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => navigate(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || "Admin"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">AI Training Library</h1>
              <p className="text-muted-foreground mt-1">
                Train the AI with hooks, examples, and guidelines for better post generation
              </p>
            </div>
            <div className="flex gap-2">
              {itemsMissingEmbeddings > 0 && (
                <Button
                  variant="outline"
                  onClick={() => regenerateEmbeddings.mutate()}
                  disabled={regenerateEmbeddings.isPending}
                >
                  {regenerateEmbeddings.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Generate Embeddings ({itemsMissingEmbeddings})
                </Button>
              )}
              <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Items</CardDescription>
                <CardTitle className="text-2xl">
                  {trainingItems?.length || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  <CardDescription>Hooks</CardDescription>
                </div>
                <CardTitle className="text-2xl">
                  {itemsByCategory.hook?.length || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  <CardDescription>Example Posts</CardDescription>
                </div>
                <CardTitle className="text-2xl">
                  {itemsByCategory.example_post?.length || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  <CardDescription>Guidelines</CardDescription>
                </div>
                <CardTitle className="text-2xl">
                  {itemsByCategory.guideline?.length || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Training Items List */}
          <Card>
            <CardHeader>
              <CardTitle>Training Items</CardTitle>
              <CardDescription>
                Manage your training content. Active items will be used in post generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrainingItemsList
                items={trainingItems || []}
                itemsByCategory={itemsByCategory}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteItemId(id)}
                onToggleActive={(id, isActive) =>
                  toggleActive.mutate({ id, is_active: isActive })
                }
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <AddTrainingItemDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditItem(null);
        }}
        onSave={handleSaveItem}
        editItem={editItem}
        isLoading={createItem.isPending || updateItem.isPending}
      />

      {/* Upload Dialog */}
      <UploadTrainingDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isUploading={uploadDocument.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteItemId}
        onOpenChange={(open) => !open && setDeleteItemId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
