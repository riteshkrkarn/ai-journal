import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/logo";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <BrandMark className="h-7 w-7 shrink-0" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            ReflectIQ
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate("/about")}
            className={`hidden sm:inline-flex rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              location.pathname === "/about"
                ? "text-foreground bg-secondary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            How it works
          </button>

          <ThemeToggle compact />

          <Button
            onClick={() => navigate("/auth")}
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-secondary"
          >
            Sign In
          </Button>

          <Button
            onClick={() => navigate("/auth")}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            Get Started
          </Button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
