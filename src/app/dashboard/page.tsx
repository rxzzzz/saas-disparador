// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createServer } from '@/lib/supabaseServer';
import LogoutButton from '@/components/auth/LogoutButton';
import DashboardClient from '@/components/dashboard/DashboardClient'; // Importando nosso novo componente

export default async function DashboardPage() {
  // 1. Segurança no servidor (como antes)
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/');
  }

  // 2. Renderiza a estrutura da página e chama o componente de cliente
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Meu Dashboard</h1>
          <LogoutButton />
        </header>
        
        <DashboardClient /> {/* A parte interativa agora vive aqui */}

      </div>
    </div>
  );
}