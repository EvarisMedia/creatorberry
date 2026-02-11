import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const benefits = [
  "Generate validated product ideas with PMF scoring",
  "Create professional digital products in minutes",
  "Publish to Amazon KDP, Gumroad & more",
  "AI-powered content expansion & formatting",
];

const Signup = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-foreground text-primary-foreground items-center justify-center p-12">
        <div className="max-w-md">
          <div className="text-5xl font-bold mb-6">
            Start Your
            <br />
            Creator Journey
          </div>
          <p className="text-xl text-primary-foreground/70 mb-8">
            Everything you need to build, validate, and launch digital products.
          </p>
          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 border-2 border-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-primary-foreground/80">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-foreground" />
            <span className="font-bold text-lg">Creator OS</span>
          </Link>
          
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-muted-foreground mb-8">
            Start your 14-day free trial. No credit card required.
          </p>
          
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  className="h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                className="h-12"
              />
            </div>
            
            <Button className="w-full h-12 shadow-sm hover:shadow-md transition-all">
              Create Account
            </Button>
          </form>
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing up, you agree to our{" "}
            <a href="#" className="underline">Terms of Service</a> and{" "}
            <a href="#" className="underline">Privacy Policy</a>.
          </p>
          
          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
