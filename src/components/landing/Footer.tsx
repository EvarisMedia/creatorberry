import { Link } from "react-router-dom";
import creatorberryLogo from "@/assets/creatorberry-logo.png";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-16">
      <div className="container px-4">
        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <img src={creatorberryLogo} alt="CreatorBerry" className="w-12 h-12 rounded-xl object-contain" />
            </Link>
            <p className="text-sm text-muted-foreground">Build, validate, and launch digital products with AI-powered tools.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><a href="#how-it-works" className="hover:text-foreground">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Product Creation Guide</a></li>
              <li><a href="#" className="hover:text-foreground">Launch Tips</a></li>
              <li><a href="#" className="hover:text-foreground">Help Center</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">About</a></li>
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CreatorBerry. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
