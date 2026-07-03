"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  ArrowRightLeft,
  Activity,
  LogOut,
  Wallet,
  Menu,
  X,
  Hexagon
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard },
  { href: "/cartoes", label: "CARTÕES", icon: CreditCard },
  { href: "/pix", label: "TRANSFERÊNCIAS", icon: ArrowRightLeft },
  { href: "/investimentos", label: "INVESTIMENTOS", icon: Activity },
  { href: "/emprestimos", label: "EMPRÉSTIMOS", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-secondary rounded-sm border border-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {(isOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={cn(
              "fixed lg:static top-0 left-0 h-screen w-72 bg-card/80 backdrop-blur-xl border-r border-border p-8 flex flex-col z-40 lg:translate-x-0 transition-transform duration-300",
              isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}
          >
            <div className="flex items-center gap-4 mb-16 mt-4 lg:mt-0">
               <div className="w-10 h-10 bg-secondary border border-border flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-primary/20 blur-sm"></div>
                 <span className="text-primary font-bold text-lg relative z-10">Tl</span>
              </div>
              <span className="text-xl font-light tracking-widest uppercase">Thallium</span>
            </div>

            <nav className="flex-1 space-y-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-sm transition-all duration-300 group relative overflow-hidden",
                      isActive
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-0 w-1 h-full bg-primary"
                      />
                    )}
                    <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")} />
                    <span className="tracking-widest text-xs uppercase">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-4 px-4 py-3 rounded-sm text-muted-foreground hover:text-destructive transition-all mt-auto group"
            >
              <LogOut className="w-5 h-5 group-hover:text-destructive" />
              <span className="tracking-widest text-xs uppercase">ENCERRAR SESSÃO</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
