// src/components/contacts/AddContactModal.tsx
"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreatableCombobox } from "../ui/creatable-combobox";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Contact } from "@/types";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: (page?: number) => void;
  contactToEdit: Contact | null;
  existingGroups: string[];
}

export default function AddContactModal({
  isOpen,
  onClose,
  onContactAdded,
  contactToEdit,
  existingGroups,
}: AddContactModalProps) {
  // Estados para cada campo do formulário
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [group, setGroup] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  // Função para limpar o formulário
  const resetForm = () => {
    setName("");
    setPhone("");
    setGroup("");
    setNotes("");
  };

  // Esquema de validação Zod
  const contactSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    phone: z
      .string()
      .regex(
        /^\d{10,15}$/,
        "O telefone deve conter apenas números e ter entre 10 e 15 dígitos."
      ),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = contactSchema.safeParse({ name, phone });
    if (!result.success) {
      // Pega o primeiro erro e mostra no toast
      const firstError = result.error.issues[0];
      toast.error(firstError.message);
      setIsSubmitting(false);
      return;
    }

    // 1. Pega o usuário logado
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você não está logado. Por favor, faça o login novamente.");
      setIsSubmitting(false);
      return;
    }

    let error;

    if (contactToEdit) {
      // MODO DE EDIÇÃO: Executa um UPDATE
      const { error: updateError } = await supabase
        .from("contacts")
        .update({
          ...result.data,
          group: group || null,
          notes: notes || null,
        })
        .eq("id", contactToEdit.id);
      error = updateError;
      if (!error) {
        toast.success("Contato atualizado com sucesso!");
        onContactAdded();
        onClose();
      } else {
        console.error("Erro ao salvar contato:", error);
        toast.error("Ocorreu um erro ao salvar o contato.", {
          description: error ? error.message : undefined,
        });
      }
    } else {
      // MODO DE ADIÇÃO
      const { data: insertData, error: insertError } = await supabase
        .from("contacts")
        .insert([
          {
            ...result.data,
            group: group || null,
            notes: notes || null,
            user_id: user.id,
          },
        ])
        .select();
      error = insertError;
      if (!error && insertData) {
        const { count } = await supabase
          .from("contacts")
          .select("*", { count: "exact", head: true });
        const pageSize = 10;
        const lastPage = Math.ceil((count || 0) / pageSize);
        toast.success("Contato adicionado com sucesso!");
        onContactAdded(lastPage > 0 ? lastPage : 1);
        onClose();
      } else {
        console.error("Erro ao salvar contato:", error);
        toast.error("Ocorreu um erro ao salvar o contato.", {
          description: error ? error.message : undefined,
        });
      }
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (contactToEdit) {
      setName(contactToEdit.name);
      setPhone(contactToEdit.phone);
      setGroup(contactToEdit.group || "");
      setNotes(contactToEdit.notes || "");
    } else {
      // Se não há contato para editar (modo de adição), limpa o formulário
      setName("");
      setPhone("");
      setGroup("");
      setNotes("");
    }
  }, [contactToEdit, isOpen]); // Roda quando o contato ou o modal muda

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {contactToEdit ? "Editar Contato" : "Adicionar Novo Contato"}
          </DialogTitle>
        </DialogHeader>
        {/* Usamos um formulário para que o 'submit' funcione */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (com DDD)</Label>
              <Input
                id="phone"
                placeholder="Ex: 5511987654321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">Grupo (opcional)</Label>
              <CreatableCombobox
                options={existingGroups.map((g) => ({ value: g, label: g }))}
                value={group}
                onChange={setGroup}
                placeholder="Selecione ou crie um grupo"
                searchPlaceholder="Buscar ou criar..."
              />
            </div>
            <div className="space-y-2">
              <Label>Etiquetas (opcional)</Label>
              <div className="flex flex-wrap gap-2">
                {/* Funcionalidade de etiquetas será implementada futuramente */}
                <Button variant="outline" size="sm" disabled>
                  + Adicionar Etiqueta
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Informações Adicionais</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre o contato..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Salvando..." : "Salvar Contato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
