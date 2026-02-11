import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Clock, LogOut, RefreshCw } from "lucide-react";

const PendingApproval = () => {
  const { user, profile, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
    if (!isLoading && profile?.is_approved) {
      navigate("/dashboard");
    }
  }, [user, profile, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-foreground" />
          <span className="font-bold text-lg">Creator OS</span>
        </Link>
        
        <div className="w-20 h-20 mx-auto mb-8 border-4 border-foreground flex items-center justify-center">
          <Clock className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Pending Approval</h1>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Your account has been created successfully! An administrator needs to approve 
          your access before you can start using Creator OS.
        </p>
        
        <div className="border-2 border-foreground p-6 mb-8 bg-secondary">
          <p className="text-sm text-muted-foreground mb-2">Signed in as</p>
          <p className="font-medium">{profile?.email || user?.email}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="shadow-xs hover:shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Status
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="shadow-xs hover:shadow-sm transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-12">
          Questions? Contact{" "}
          <a href="mailto:support@authorityos.com" className="underline hover:text-foreground transition-colors">
            support@authorityos.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;
