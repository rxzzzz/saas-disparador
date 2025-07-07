// src/components/contacts/AddContactModal.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { createClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: () => void; // Nova propriedade para atualizar a lista
}

export default function AddContactModal({ isOpen, onClose, onContactAdded }: AddContactModalProps) {
  // Estados para cada campo do formulário
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  // Função para limpar o formulário
  const resetForm = () => {
    setName('');
    setPhone('');
    setGroup('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!name || !phone) {
      toast.error("Nome e Telefone são obrigatórios.");
      setIsSubmitting(false);
      return;
    }

    // 1. Pega o usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você não está logado. Por favor, faça o login novamente.");
      setIsSubmitting(false);
      return;
    }

    // 2. Insere os dados na tabela 'contacts'
    const { error } = await supabase
      .from('contacts')
      .insert([{
        name: name,
        phone: phone,
        group: group || null, // Salva null se o grupo estiver vazio
        notes: notes || null, // Salva null se as notas estiverem vazias
        user_id: user.id, // Vincula o contato ao usuário
      }]);

    // 3. Trata o resultado
    if (error) {
      console.error("Erro ao salvar contato:", error);
      toast.error("Ocorreu um erro ao salvar o contato.", { description: error.message });
    } else {
      toast.success("Contato adicionado com sucesso!");
      resetForm(); // Limpa o formulário
      onContactAdded(); // Avisa a página pai que um novo contato foi adicionado
      onClose(); // Fecha o modal
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Contato</DialogTitle>
        </DialogHeader>
        {/* Usamos um formulário para que o 'submit' funcione */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (com DDD)</Label>
              <Input id="phone" placeholder="Ex: 5511987654321" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">Grupo (opcional)</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clientes VIP">Clientes VIP</SelectItem>
                  <SelectItem value="Clientes Regulares">Clientes Regulares</SelectItem>
                  <SelectItem value="Fornecedores">Fornecedores</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etiquetas (opcional)</Label>
              <div className="flex flex-wrap gap-2">
                {/* Funcionalidade de etiquetas será implementada futuramente */}
                <Button variant="outline" size="sm" disabled>+ Adicionar Etiqueta</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Informações Adicionais</Label>
              <Textarea id="notes" placeholder="Observações sobre o contato..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Contato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}