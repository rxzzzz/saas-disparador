// src/components/contacts/AddContactModal.tsx
'use client';

import { useState, useEffect } from 'react';
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
import { Contact } from '@/types';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: () => void;
  contactToEdit: Contact | null; // Nova propriedade
}

export default function AddContactModal({ isOpen, onClose, onContactAdded, contactToEdit }: AddContactModalProps) {
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

    let error;

    if (contactToEdit) {
        // MODO DE EDIÇÃO: Executa um UPDATE
        const { error: updateError } = await supabase
            .from('contacts')
            .update({ 
                name: name, 
                phone: phone, 
                group: group || null, 
                notes: notes || null 
            })
            .eq('id', contactToEdit.id); // A condição para saber QUAL contato atualizar
        error = updateError;
    } else {
        // MODO DE ADIÇÃO: Executa um INSERT
        const { error: insertError } = await supabase
            .from('contacts')
            .insert([{ 
                name: name, 
                phone: phone, 
                group: group || null, 
                notes: notes || null, 
                user_id: user.id 
            }]);
        error = insertError;
    }

    // 3. Trata o resultado
    if (error) {
      console.error("Erro ao salvar contato:", error);
      toast.error("Ocorreu um erro ao salvar o contato.", { description: error.message });
    } else {
      toast.success(contactToEdit ? "Contato atualizado com sucesso!" : "Contato adicionado com sucesso!");
      onContactAdded(); // Avisa a página pai que um novo contato foi adicionado
      onClose(); // Fecha o modal
    }

    setIsSubmitting(false);
  };

    useEffect(() => {
        if (contactToEdit) {
            setName(contactToEdit.name);
            setPhone(contactToEdit.phone);
            setGroup(contactToEdit.group || '');
            setNotes(contactToEdit.notes || '');
        } else {
            // Se não há contato para editar (modo de adição), limpa o formulário
            setName('');
            setPhone('');
            setGroup('');
            setNotes('');
        }
    }, [contactToEdit, isOpen]); // Roda quando o contato ou o modal muda

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
                  <DialogTitle>
                      {contactToEdit ? 'Editar Contato' : 'Adicionar Novo Contato'}
                  </DialogTitle>
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