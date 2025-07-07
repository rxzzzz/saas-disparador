// src/app/dashboard/contacts/page.tsx
'use client'; // Necessário para controlar o estado do modal

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import AddContactModal from '@/components/contacts/AddContactModal';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Contact } from '@/types';

export default function ContactsPage() {

  // Estado para controlar a abertura do modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const supabase = createClient();

    const fetchContacts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('contacts')
            .select('*'); // Seleciona todas as colunas

        if (error) {
            toast.error("Erro ao buscar contatos.");
            console.error("Erro ao buscar contatos:", error);
        } else if (data) {
            setContacts(data);
        }
        setIsLoading(false);
    };

    const handleEditContact = (contact: Contact) => {
        setEditingContact(contact);
        setIsModalOpen(true);
    };

    const handleDeleteContact = async (contactId: number) => {
        // Confirmação para evitar exclusões acidentais
        if (!confirm("Você tem certeza que deseja deletar este contato? Esta ação não pode ser desfeita.")) {
            return;
        }

        const { error } = await supabase
            .from('contacts')
            .delete()
            .match({ id: contactId });

        if (error) {
            toast.error("Erro ao deletar contato.", { description: error.message });
        } else {
            toast.success("Contato deletado com sucesso!");
            // Atualiza a lista na tela removendo o contato deletado
            setContacts(contacts.filter(contact => contact.id !== contactId));
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []); // O array vazio [] garante que isso rode apenas uma vez

  return (
    <>
          <AddContactModal
              isOpen={isModalOpen}
              onClose={() => {
                  setIsModalOpen(false);
                  setEditingContact(null); // Limpa o contato em edição
              }}
              onContactAdded={fetchContacts}
              contactToEdit={editingContact} // Passa o contato para o modal
          />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Lista de Contatos</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Contato
        </Button>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Input placeholder="🔍 Buscar contatos..." className="max-w-xs" />
          {/* Filtro será implementado futuramente */}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"><Checkbox /></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Etiquetas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
                  <TableBody>
                      {isLoading ? (
                          <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center">
                                  Carregando...
                              </TableCell>
                          </TableRow>
                      ) : contacts.length > 0 ? (
                          contacts.map((contact) => (
                              <TableRow key={contact.id}>
                                  <TableCell><Checkbox /></TableCell>
                                  <TableCell className="font-medium">{contact.name}</TableCell>
                                  <TableCell>{contact.phone}</TableCell>
                                  <TableCell>{contact.group || '-'}</TableCell>
                                  <TableCell>
                                      {/* Placeholder para as etiquetas */}
                                  </TableCell>
                                  <TableCell className="flex justify-end gap-2">
                                      <Button variant="ghost" size="icon" onClick={() => handleEditContact(contact)}>
                                          <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-destructive hover:text-destructive"
                                          onClick={() => handleDeleteContact(contact.id)}
                                      >
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center">
                                  Nenhum contato encontrado.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
        </Table>
        
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>Mostrando 1-3 de 25 contatos</div>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
              <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
              <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
              <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
              <PaginationItem><PaginationNext href="#" /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </>
  );
}