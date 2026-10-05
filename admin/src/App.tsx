import { NavLink, Route, Routes } from "react-router-dom";
import { cn } from "@/lib/utils";
import { UsersPage } from "./pages/UsersPage";
import { UserPage } from "./pages/UserPage";
import { TransferPage } from "./pages/TransferPage";

const navLinks = [
  { to: "/", label: "Users" },
  { to: "/transfer", label: "Transfer" },
];

export function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <span className="font-serif text-xl text-primary">Mise Admin</span>
          <nav className="flex gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent",
                    isActive && "bg-accent text-foreground"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Routes>
          <Route path="/" element={<UsersPage />} />
          <Route path="/users/:userId" element={<UserPage />} />
          <Route path="/transfer" element={<TransferPage />} />
        </Routes>
      </main>
    </div>
  );
}
