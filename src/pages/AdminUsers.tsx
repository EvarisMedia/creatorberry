import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  Users,
  Brain,
  LogOut,
  Check,
  X,
  Loader2,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
  created_at: string;
}

import { Settings } from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: false },
  { icon: Users, label: "Users", href: "/admin/users", active: true },
  { icon: Brain, label: "AI Training", href: "/admin/training", active: false },
  { icon: Settings, label: "Settings", href: "/admin/settings", active: false },
];

const AdminUsers = () => {
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
    if (!isLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to fetch users");
    } else {
      setUsers(data as UserProfile[]);
    }
    setLoadingUsers(false);
  };

  const handleApproval = async (userId: string, approve: boolean) => {
    setUpdatingUser(userId);
    
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: approve })
      .eq("user_id", userId);
    
    if (error) {
      toast.error("Failed to update user");
    } else {
      toast.success(approve ? "User approved" : "User access revoked");
      fetchUsers();
    }
    
    setUpdatingUser(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
      {/* Sidebar */}
      <aside className="w-64 border-r-2 border-foreground bg-background flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b-2 border-foreground">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground" />
            <span className="font-bold">Creator OS</span>
          </Link>
        </div>
        
        {/* Admin Badge */}
        <div className="p-4 border-b-2 border-foreground">
          <div className="flex items-center gap-2 p-3 bg-foreground text-primary-foreground">
            <Shield className="w-4 h-4" />
            <span className="font-medium text-sm">Admin Panel</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {sidebarItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                    item.active 
                      ? "bg-foreground text-primary-foreground" 
                      : "hover:bg-secondary"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User */}
        <div className="p-4 border-t-2 border-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary border-2 border-foreground flex items-center justify-center font-bold text-sm">
                {profile?.full_name?.charAt(0) || "A"}
              </div>
              <div className="text-sm">
                <div className="font-medium">{profile?.full_name || "Admin"}</div>
                <div className="text-xs text-muted-foreground">Administrator</div>
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 hover:bg-secondary transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="p-6 border-b-2 border-foreground">
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Approve or revoke user access</p>
        </header>
        
        {/* Users List */}
        <div className="p-6">
          <Card className="border-2 border-foreground shadow-xs">
            <CardHeader className="border-b-2 border-foreground">
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {users.filter(u => !u.is_approved).length} pending approval
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No users found
                </div>
              ) : (
                users.map((userProfile) => (
                  <div
                    key={userProfile.id}
                    className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-secondary transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {userProfile.full_name || "No name"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {userProfile.email}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(userProfile.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 text-xs font-mono uppercase border-2 border-foreground ${
                        userProfile.is_approved 
                          ? "bg-foreground text-primary-foreground" 
                          : "bg-secondary"
                      }`}>
                        {userProfile.is_approved ? "Approved" : "Pending"}
                      </div>
                      {userProfile.user_id !== user?.id && (
                        <div className="flex gap-2">
                          {!userProfile.is_approved ? (
                            <Button
                              size="sm"
                              onClick={() => handleApproval(userProfile.user_id, true)}
                              disabled={updatingUser === userProfile.user_id}
                              className="shadow-xs"
                            >
                              {updatingUser === userProfile.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproval(userProfile.user_id, false)}
                              disabled={updatingUser === userProfile.user_id}
                              className="shadow-xs"
                            >
                              {updatingUser === userProfile.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="w-4 h-4 mr-1" />
                                  Revoke
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
