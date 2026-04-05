"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Link } from "@heroui/react";
import { Search, Moon, Sun, LogIn, User, Shield, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/providers/AuthProvider";
import NextLink from "next/link";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [navQuery, setNavQuery] = useState("");

  const handleNavSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && navQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(navQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-xl items-center justify-between gap-4 px-4">
        <NextLink href="/" className="flex items-center gap-2 shrink-0">
          <h1 className="text-xl font-bold tracking-tight">AcronyMap</h1>
        </NextLink>

        {/* Centered search bar — hidden on small screens */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted transition-colors group-focus-within:text-primary" />
            <Input
              type="text"
              placeholder="Search acronyms..."
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              onKeyDown={handleNavSearch}
              className="w-full h-9 pl-10 rounded-lg border border-border/40 bg-surface-secondary text-sm focus-within:border-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Toggle theme"
            onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link href="/dashboard" className="hidden md:flex items-center gap-1 text-sm px-3 py-1.5">
                  <Shield className="h-4 w-4" />
                  Dashboard
                </Link>
              )}

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-secondary">
                <User className="h-4 w-4 text-muted" />
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {user?.email}
                </span>
                {isAdmin && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    Admin
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onPress={async () => {
                  await logout();
                  window.location.href = "/";
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Link href="/login" className="flex items-center gap-1 text-sm px-3 py-1.5">
              <LogIn className="h-4 w-4" />
              <span className="hidden md:inline">Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
