import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/src/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateMcpTokenButton } from "./create-mcp-token-button";

export function AppHeader() {
  const { isAuthenticated, isLoading, signIn, signOut } = useAuth();
  const location = useLocation();

  const navLinks = [
    { href: "/food", label: "Recipes" },
    { href: "/food/meal-planner", label: "Meal Planner" },
  ];

  return (
    <header className="border-b border-border bg-card">
      {/* First row: Logo and Auth buttons */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/food" className="font-serif text-xl text-primary cursor-pointer">
          KitchenCalm
        </Link>

        <div className="flex items-center gap-1">
          {isLoading ? null : isAuthenticated ? (
            <>
              <CreateMcpTokenButton />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-muted-foreground"
              >
                <LogOut className="size-4 mr-2" />
                Sign out
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signIn()}
              className="text-muted-foreground"
            >
              <LogIn className="size-4 mr-2" />
              Sign in
            </Button>
          )}
        </div>
      </div>

      {/* Second row: Navigation */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/food"
                  ? location.pathname === "/food"
                  : location.pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-sm px-3 py-2 cursor-pointer transition-colors border-b-2",
                    isActive
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
