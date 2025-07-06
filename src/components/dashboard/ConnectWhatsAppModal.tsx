// src/components/dashboard/ConnectWhatsAppModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from 'next/image';
import { toast } from 'sonner';

interface ConnectWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectWhatsAppModal({ isOpen, onClose }: ConnectWhatsAppModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');

  useEffect(() => {
    if (isOpen) {
      // Quando o modal abre, começa a verificar o status
      const intervalId = setInterval(async () => {
        try {
          const response = await fetch('http://localhost:3001/status');
          const data = await response.json();

          setConnectionStatus(data.status);

          if (data.status === 'Aguardando QR Code' && data.qrCode) {
            setQrCode(data.qrCode);
          }

          if (data.status === 'Conectado') {
            toast.success("WhatsApp Conectado!");
            clearInterval(intervalId);
            onClose(); // Fecha o modal automaticamente ao conectar
          }
        } catch (error) {
          console.error('Erro ao buscar status:', error);
          clearInterval(intervalId);
        }
      }, 2000); // Verifica a cada 2 segundos

      return () => clearInterval(intervalId);
    }
  }, [isOpen, onClose]);

  const handleStartConnection = async () => {
    setConnectionStatus('Iniciando');
    await fetch('http://localhost:3001/connect', { method: 'POST' });
  };
  
  // Inicia a conexão assim que o modal é aberto
  useEffect(() => {
    if (isOpen) {
      handleStartConnection();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code abaixo com o WhatsApp no seu celular para conectar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 gap-4">
          <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg">
            {connectionStatus === 'Iniciando' && <p>Gerando QR Code...</p>}
            {qrCode && <Image src={qrCode} alt="WhatsApp QR Code" width={256} height={256} />}
          </div>
          <p className="text-sm text-gray-500">Válido por 2 minutos</p>
          {connectionStatus === 'Conectado' && (
            <p className="text-green-500 font-bold">Conectado com sucesso!</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}