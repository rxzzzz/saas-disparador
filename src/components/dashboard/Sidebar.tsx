// src/components/dashboard/Sidebar.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Rocket,
  MessageSquare,
  Users,
  BarChart,
  Settings,
  Power,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Reutilizando o botão de Logout que já temos!
import LogoutButton from "../auth/LogoutButton";

import { Wifi, WifiOff } from "lucide-react";

interface SidebarProps {
  connectionStatus: string;
}

export default function Sidebar({ connectionStatus }: SidebarProps) {
  const pathname = usePathname();
  const navLinks = [
    { href: "/dashboard", label: "Disparos", icon: Rocket },
    { href: "/dashboard/contacts", label: "Contatos", icon: Users },
    { href: "/dashboard/reports", label: "Relatórios", icon: BarChart },
    { href: "/dashboard/settings", label: "Configurações", icon: Settings },
  ];

  const isConnected =
    connectionStatus === "Conectado" ||
    connectionStatus === "qrReadSuccess" ||
    connectionStatus === "chatsAvailable";

  return (
    <aside className="w-64 flex-shrink-0 p-6 flex flex-col bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800">
      <div className="p-4 -m-6 mb-10 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          <h1 className="text-xl font-bold">WhatsBulk</h1>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold">
          UD
        </div>
        <div>
          <p className="font-semibold">Usuário Demo</p>
          <p className="text-xs text-gray-500">Plano Básico</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.label} href={link.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
          {/* NOVO INDICADOR DE STATUS */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">WhatsApp</span>
              <span
                className={`text-xs ${
                  isConnected ? "text-green-500" : "text-red-500"
                }`}
              >
                {isConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
