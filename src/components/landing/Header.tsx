import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-creator-gradient flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Creator OS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link to={profile?.is_approved ? "/dashboard" : "/pending-approval"}>
              <Button className="bg-creator-gradient hover:opacity-90">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/auth"><Button variant="ghost">Log In</Button></Link>
              <Link to="/auth"><Button className="bg-creator-gradient hover:opacity-90">Get Started Free</Button></Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border p-4 space-y-4">
          <a href="#features" className="block py-2 text-muted-foreground hover:text-foreground">Features</a>
          <a href="#how-it-works" className="block py-2 text-muted-foreground hover:text-foreground">How It Works</a>
          <a href="#pricing" className="block py-2 text-muted-foreground hover:text-foreground">Pricing</a>
          <a href="#faq" className="block py-2 text-muted-foreground hover:text-foreground">FAQ</a>
          <div className="flex flex-col gap-2 pt-2">
            <Link to="/auth"><Button variant="outline" className="w-full">Log In</Button></Link>
            <Link to="/auth"><Button className="w-full bg-creator-gradient hover:opacity-90">Get Started Free</Button></Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
