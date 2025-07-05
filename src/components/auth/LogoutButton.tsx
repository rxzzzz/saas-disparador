// src/components/auth/LogoutButton.tsx
'use client'; // Este é um componente interativo, precisa da diretiva

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient'; // Usamos o cliente do navegador aqui
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // Redireciona para a página de login
    router.refresh(); // Atualiza a página para limpar o cache
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      Sair
    </Button>
  );
}