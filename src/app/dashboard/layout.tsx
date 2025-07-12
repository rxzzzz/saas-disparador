"use client";
// src/app/dashboard/layout.tsx
import Sidebar from "@/components/dashboard/Sidebar";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [connectionStatus, setConnectionStatus] = useState("Desconectado");

  useEffect(() => {
    // Verifica o status periodicamente
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch("http://localhost:3001/status");
        const data = await response.json();
        setConnectionStatus(data.status);
      } catch (error) {
        // Se não conseguir conectar ao backend, assume desconectado
        setConnectionStatus("Desconectado");
      }
    }, 5000); // Verifica a cada 5 segundos

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex min-h-screen">
        <Sidebar connectionStatus={connectionStatus} />
        <main className="flex-1 p-8 bg-gray-100 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </>
  );
}
