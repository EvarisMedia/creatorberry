import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/hooks/useAuth";
import { usePlans } from "@/hooks/usePlans";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  Loader2,
  Pencil,
  Trash2,
  Search,
  UserPlus,
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
  plan_id: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { plans, assignPlan } = usePlans();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending">("all");
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editApproved, setEditApproved] = useState(false);
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // Add user state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newApproved, setNewApproved] = useState(true);
  const [newPlanId, setNewPlanId] = useState<string | null>(null);
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    if (!isLoading && !isAdmin) navigate("/dashboard");
  }, [user, isAdmin, isLoading, navigate]);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: isAdmin,
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "approved" && u.is_approved) ||
      (statusFilter === "pending" && !u.is_approved);
    return matchesSearch && matchesStatus;
  });

  const handleApproval = async (userId: string, approve: boolean) => {
    setUpdatingUser(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: approve })
      .eq("user_id", userId);
    if (error) toast.error("Failed to update user");
    else {
      toast.success(approve ? "User approved" : "User access revoked");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
    setUpdatingUser(null);
  };

  const openEdit = (u: UserProfile) => {
    setEditUser(u);
    setEditName(u.full_name || "");
    setEditApproved(u.is_approved);
    setEditPlanId(u.plan_id);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setUpdatingUser(editUser.user_id);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editName,
        is_approved: editApproved,
        plan_id: editPlanId,
      } as any)
      .eq("user_id", editUser.user_id);
    if (error) toast.error("Failed to update user");
    else {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
    setEditUser(null);
    setUpdatingUser(null);
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", deleteUserId);
    if (error) toast.error("Failed to delete user");
    else {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
    setDeleteUserId(null);
  };

  const handleAddUser = async () => {
    if (!newEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    setAddingUser(true);
    // Create a profile entry directly (no auth account — admin-managed user)
    const { error } = await supabase.from("profiles").insert({
      user_id: crypto.randomUUID(),
      email: newEmail.trim(),
      full_name: newName.trim() || null,
      is_approved: newApproved,
      plan_id: newPlanId,
    } as any);
    if (error) {
      toast.error("Failed to add user: " + error.message);
    } else {
      toast.success("User added successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setShowAddUser(false);
      setNewEmail("");
      setNewName("");
      setNewApproved(true);
      setNewPlanId(null);
    }
    setAddingUser(false);
  };

  const handleAssignPlan = async (userId: string, planId: string) => {
    await assignPlan.mutateAsync({ userId, planId: planId === "none" ? null : planId });
  };

  const getPlanName = (planId: string | null) => {
    if (!planId) return "No plan";
    return plans?.find((p) => p.id === planId)?.name || "Unknown";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <header className="p-6 border-b">
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Manage users, assign plans, and control access</p>
            <Button onClick={() => setShowAddUser(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-4">
          {/* Search & Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {users.filter((u) => !u.is_approved).length} pending approval
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No users found</div>
              ) : (
                filteredUsers.map((userProfile) => (
                  <div
                    key={userProfile.id}
                    className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{userProfile.full_name || "No name"}</div>
                      <div className="text-sm text-muted-foreground">{userProfile.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Joined {new Date(userProfile.created_at).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getPlanName(userProfile.plan_id)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={userProfile.is_approved ? "default" : "secondary"}>
                        {userProfile.is_approved ? "Approved" : "Pending"}
                      </Badge>

                      {/* Quick plan assign */}
                      <Select
                        value={userProfile.plan_id || "none"}
                        onValueChange={(v) => handleAssignPlan(userProfile.user_id, v)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue placeholder="Assign plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No plan</SelectItem>
                          {plans?.filter((p) => p.is_active).map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {userProfile.user_id !== user?.id && (
                        <>
                          {!userProfile.is_approved ? (
                            <Button
                              size="sm"
                              onClick={() => handleApproval(userProfile.user_id, true)}
                              disabled={updatingUser === userProfile.user_id}
                            >
                              {updatingUser === userProfile.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <><Check className="w-4 h-4 mr-1" />Approve</>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproval(userProfile.user_id, false)}
                              disabled={updatingUser === userProfile.user_id}
                            >
                              {updatingUser === userProfile.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <><X className="w-4 h-4 mr-1" />Revoke</>
                              )}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => openEdit(userProfile)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteUserId(userProfile.user_id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user profile and plan assignment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editUser?.email || ""} disabled />
            </div>
            <div className="flex items-center justify-between">
              <Label>Approved</Label>
              <Switch checked={editApproved} onCheckedChange={setEditApproved} />
            </div>
            <div>
              <Label>Assigned Plan</Label>
              <Select value={editPlanId || "none"} onValueChange={(v) => setEditPlanId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No plan</SelectItem>
                  {plans?.filter((p) => p.is_active).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} (${p.price})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updatingUser === editUser?.user_id}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Manually add a new user profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Approved</Label>
              <Switch checked={newApproved} onCheckedChange={setNewApproved} />
            </div>
            <div>
              <Label>Assign Plan</Label>
              <Select value={newPlanId || "none"} onValueChange={(v) => setNewPlanId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No plan</SelectItem>
                  {plans?.filter((p) => p.is_active).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} (${p.price})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={addingUser}>
              {addingUser ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the user's profile. This action cannot be undone.
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
};

export default AdminUsers;
