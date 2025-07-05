// src/components/dashboard/DashboardClient.tsx - VERSÃO COMPLETA E POLIDA
'use client'; 

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from 'next/image';
import { Toaster, toast } from 'sonner';

export default function DashboardClient() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [isLoading, setIsLoading] = useState(false); // Mantido para o feedback do clique
  const [isPageLoading, setIsPageLoading] = useState(true); // NOVO: Para o carregamento inicial da página
  const [message, setMessage] = useState('');
  const [numbers, setNumbers] = useState('');

  // Efeito aprimorado para rodar no carregamento da página e verificar status
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/status');
        const data = await response.json();

        setConnectionStatus(data.status);

        if (data.status === 'Aguardando QR Code' && data.qrCode) {
          setQrCode(data.qrCode);
        } else {
          // Garante que o QR Code seja limpo em qualquer outro estado
          setQrCode(null);
        }

        // Para de verificar se já estiver conectado, desconectado ou com erro
        if (data.status === 'Conectado' || data.status === 'Desconectado' || data.status === 'Erro') {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Erro ao buscar status:', error);
        setConnectionStatus('Erro'); // Define como erro se não conseguir conectar ao backend
        if (intervalId) clearInterval(intervalId);
      } finally {
        setIsPageLoading(false); // Termina o estado de loading da página
      }
    };

    checkStatus(); // Roda uma vez imediatamente

    // Continua verificando a cada 5 segundos
    intervalId = setInterval(checkStatus, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []); // Array de dependências vazio para rodar apenas no carregamento inicial

  const handleConnect = async () => {
    setIsLoading(true);
    toast.info("Gerando QR Code...");
    try {
      await fetch('http://localhost:3001/connect', { method: 'POST' });
      // O useEffect agora vai pegar o novo status e QR code automaticamente
    } catch (error) {
      toast.error('Falha ao iniciar a conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    toast.info("Desconectando do WhatsApp...");
    try {
      await fetch('http://localhost:3001/disconnect', { method: 'POST' });
      setConnectionStatus('Desconectado');
      setQrCode(null);
      toast.success("Desconectado com sucesso!");
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      toast.error("Falha ao desconectar.");
    }
  };
  
  const handleSendMessages = async () => {
    if (!message || !numbers) {
      toast.error("Por favor, preencha a mensagem e a lista de números.");
      return;
    }
    const numbersArray = numbers.split('\n').filter(num => num.trim() !== '');
    if (numbersArray.length === 0) {
      toast.error("A lista de números está vazia ou em formato incorreto.");
      return;
    }
    toast.info(`Iniciando envio para ${numbersArray.length} números...`);
    try {
      const response = await fetch('http://localhost:3001/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, numbers: numbersArray }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(result.message || "Campanha enviada para a fila!");
      } else {
        toast.error(result.error || "Ocorreu um erro no servidor.");
      }
    } catch (error) {
      console.error("Erro ao enviar campanha:", error);
      toast.error("Não foi possível conectar ao servidor de envio.");
    }
  };

  // Função helper para renderizar o conteúdo do card de conexão
  const renderConnectionContent = () => {
    if (isPageLoading) {
      return <p className="text-gray-500">Verificando status...</p>;
    }
    if (connectionStatus === 'Aguardando QR Code' && qrCode) {
      return <Image src={qrCode} alt="QR Code do WhatsApp" width={240} height={240} />;
    }
    if (connectionStatus === 'Conectado') {
      return <p className="text-green-500 text-center font-bold">Conectado!</p>;
    }
    if (isLoading) {
      return <p className="text-gray-500">Gerando QR Code...</p>;
    }
    return <p className="text-gray-500 text-center">Clique em "Conectar" para gerar o QR Code.</p>;
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Conexão com o WhatsApp</CardTitle>
            <CardDescription>Escaneie o QR Code para começar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p>Status: 
              <span className={`font-bold ml-2 ${connectionStatus === 'Conectado' ? 'text-green-500' : 'text-red-500'}`}>
                {isPageLoading ? 'Verificando...' : connectionStatus}
              </span>
            </p>
            <div className="p-2 border rounded-md bg-white h-64 w-64 flex items-center justify-center">
              {renderConnectionContent()}
            </div>
            <div className="w-full space-y-2">
              <Button 
                className="w-full" 
                onClick={handleConnect} 
                disabled={connectionStatus !== 'Desconectado' || isLoading}
              >
                {isLoading ? 'Aguarde...' : 'Conectar WhatsApp'}
              </Button>
  
              {connectionStatus === 'Conectado' && (
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleDisconnect}
                >
                  Desconectar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>2. Criar Campanha</CardTitle>
            <CardDescription>Prepare sua mensagem e sua lista.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="message">Sua Mensagem</Label>
              <Textarea id="message" placeholder="Ex: Olá, {nome}! Sua fatura vence amanhã." className="min-h-[120px]" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="numbers">Lista de Contatos</Label>
              <Textarea id="numbers" placeholder="Cole os números aqui, um por linha. Ex: 5511999999999" className="min-h-[120px]" value={numbers} onChange={(e) => setNumbers(e.target.value)} />
            </div>
            <Button 
              className="w-full" 
              onClick={handleSendMessages}
              disabled={connectionStatus !== 'Conectado'} // Desabilita se não estiver conectado
            >
              Disparar Mensagens
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}