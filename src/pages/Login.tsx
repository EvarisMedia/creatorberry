import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import creatorberryLogo from "@/assets/creatorberry-logo.png";

const Login = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <img src={creatorberryLogo} alt="CreatorBerry" className="w-8 h-8 rounded-lg object-contain" />
          </Link>
          
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-8">
            Enter your credentials to access your dashboard.
          </p>
          
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-12"
              />
            </div>
            
            <Button className="w-full h-12 shadow-sm hover:shadow-md transition-all">
              Sign In
            </Button>
          </form>
          
          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link to="/signup" className="text-foreground font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      
      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-foreground text-primary-foreground items-center justify-center p-12">
        <div className="max-w-md">
          <div className="text-6xl font-bold mb-6">
            Create.
            <br />
            Launch.
          </div>
          <p className="text-xl text-primary-foreground/70">
            Join hundreds of creators turning their expertise into profitable digital products.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
