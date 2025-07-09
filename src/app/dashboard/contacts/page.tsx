// src/app/dashboard/contacts/page.tsx
"use client"; // Necessário para controlar o estado do modal

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import AddContactModal from "@/components/contacts/AddContactModal";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Contact } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ContactsPage() {
  // Estado para controlar a abertura do modal

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Vamos mostrar 10 contatos por página
  const [totalContacts, setTotalContacts] = useState(0);
  const supabase = createClient();

  const filteredContacts = contacts.filter((contact) => {
    const searchTermMatch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm);
    const groupMatch =
      filterGroup === "Todos"
        ? true
        : contact.group === filterGroup ||
          (filterGroup === "Sem Grupo" && !contact.group);
    return searchTermMatch && groupMatch;
  });

  const uniqueGroups = [
    "Todos",
    ...(new Set(
      contacts.map((c) => c.group || "Sem Grupo").filter(Boolean)
    ) as Set<string>),
  ];

  const fetchContacts = async (page = 1) => {
    setIsLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Busca os contatos da página atual E a contagem total
    const { data, error, count } = await supabase
      .from("contacts")
      .select("*", { count: "exact" }) // 'exact' nos dá o número total de linhas
      .range(from, to);

    if (error) {
      toast.error("Erro ao buscar contatos.");
    } else if (data) {
      setContacts(data);
      setTotalContacts(count || 0);
      setCurrentPage(page);
    }
    setIsLoading(false);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleDeleteContact = async (contactId: number) => {
    // Confirmação para evitar exclusões acidentais
    if (
      !confirm(
        "Você tem certeza que deseja deletar este contato? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("contacts")
      .delete()
      .match({ id: contactId });

    if (error) {
      toast.error("Erro ao deletar contato.", { description: error.message });
    } else {
      toast.success("Contato deletado com sucesso!");
      // Atualiza a lista na tela removendo o contato deletado
      setContacts(contacts.filter((contact) => contact.id !== contactId));
    }
  };

  useEffect(() => {
    fetchContacts(1);
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
          <div className="flex items-center gap-4">
            <Input
              placeholder="🔍 Buscar por nome ou telefone..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por grupo" />
              </SelectTrigger>
              <SelectContent>
                {uniqueGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox disabled />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>{contact.group || "-"}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditContact(contact)}
                    >
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
                <TableCell colSpan={5} className="text-center h-24">
                  Nenhum contato encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            Mostrando {filteredContacts.length} de {totalContacts} contatos
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    if (currentPage > 1) fetchContacts(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {/* A lógica de renderizar os números das páginas (1, 2, 3...) virá depois, para simplificar */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    if (currentPage < Math.ceil(totalContacts / pageSize))
                      fetchContacts(currentPage + 1);
                  }}
                  className={
                    currentPage >= Math.ceil(totalContacts / pageSize)
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </>
  );
}
