// src/app/page.tsx
'use client'; // Diretiva importante para componentes interativos

import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/dashboard'); // Se o usuário estiver logado, redireciona para o dashboard
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Bem-vindo ao Disparador</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="dark"
            providers={['google']} // Opcional: permite login com Google
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Seu email',
                  password_label: 'Sua senha',
                  button_label: 'Entrar',
                  social_provider_text: 'Entrar com {{provider}}',
                  link_text: 'Já tem uma conta? Entre',
                },
                sign_up: {
                  email_label: 'Seu email',
                  password_label: 'Crie uma senha',
                  button_label: 'Cadastrar',
                  link_text: 'Não tem uma conta? Cadastre-se',
                },
                forgotten_password: {
                  link_text: 'Esqueceu sua senha?',
                  email_label: 'Seu email',
                }
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}