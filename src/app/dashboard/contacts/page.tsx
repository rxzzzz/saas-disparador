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
import { PlusCircle, Trash2, Edit, Pencil } from "lucide-react";
import AddContactModal from "@/components/contacts/AddContactModal";
import RenameGroupModal from "@/components/RenameGroupModal";
import CreateGroupModal from "@/components/CreateGroupModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ContactsPage() {
  // Estado para seleção de contatos
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  // Estado para modal de criar grupo
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  // Função para criar grupo (apenas adiciona à lista local)
  const handleCreateGroup = (groupName: string) => {
    if (!groupName) return;
    // Evita duplicidade
    if (!uniqueGroups.includes(groupName)) {
      setUniqueGroups((prev) => [...prev, groupName]);
      toast.success("Grupo criado com sucesso.");
    }
    setIsCreateGroupModalOpen(false);
  };
  // Estado para grupo selecionado para exclusão
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Função para excluir grupo
  const handleDeleteGroup = async (groupName: string) => {
    const { error } = await supabase
      .from("contacts")
      .update({ group: null })
      .eq("group", groupName);
    if (error) {
      toast.error("Erro ao excluir grupo.", { description: error.message });
    } else {
      toast.success("Grupo excluído com sucesso.");
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
      fetchContacts(currentPage, searchTerm, filterGroup);
    }
  };
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

  // Busca grupos únicos para o filtro (agora só para o select)
  const [uniqueGroups, setUniqueGroups] = useState<string[]>(["Todos"]);
  // Novo estado: contagem de contatos por grupo
  const [groupCounts, setGroupCounts] = useState<{ [group: string]: number }>({});

  // Estado para grupo selecionado para renomear
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(
    null
  );
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  // Função para renomear grupo
  const handleRenameGroup = async (oldName: string, newName: string) => {
    if (!newName || newName === oldName) {
      setIsRenameModalOpen(false);
      setSelectedGroupName(null);
      return;
    }
    const { error } = await supabase
      .from("contacts")
      .update({ group: newName })
      .eq("group", oldName);
    if (error) {
      toast.error("Erro ao renomear grupo.", { description: error.message });
    } else {
      toast.success("Grupo renomeado com sucesso.");
      setIsRenameModalOpen(false);
      setSelectedGroupName(null);
      // Atualiza lista de contatos e grupos
      fetchContacts(currentPage, searchTerm, filterGroup);
    }
  };

  // Função centralizada para busca, filtro e paginação no backend
  const fetchContacts = async (
    page = 1,
    searchTermParam = "",
    filterGroupParam = "Todos"
  ) => {
    setIsLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("contacts").select("*", { count: "exact" });

    // Adiciona o filtro de busca se houver um termo
    if (searchTermParam) {
      query = query.or(
        `name.ilike.%${searchTermParam}%,phone.ilike.%${searchTermParam}%`
      );
    }

    // Adiciona o filtro de grupo se não for 'Todos'
    if (filterGroupParam !== "Todos") {
      if (filterGroupParam === "Sem Grupo") {
        query = query.is("group", null);
      } else {
        query = query.eq("group", filterGroupParam);
      }
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      toast.error("Erro ao buscar contatos.");
    } else if (data) {
      setContacts(data);
      setTotalContacts(count || 0);
      setCurrentPage(page);
      // Atualiza os grupos únicos para o filtro (busca todos os grupos do banco)
      fetchAllGroupsAndCounts();
    }
    setIsLoading(false);
  };

  // Busca todos os grupos distintos e suas contagens diretamente do Supabase
  const fetchAllGroupsAndCounts = async () => {
    // Busca todos os grupos distintos
    const { data: groupsData, error: groupsError } = await supabase
      .from("contacts")
      .select("group")
      .neq("group", null);
    if (groupsError) return;
    const groupNames = Array.from(new Set(groupsData.map((g: any) => g.group)));
    setUniqueGroups(["Todos", ...groupNames]);

    // Para cada grupo, busca a contagem total
    const counts: { [group: string]: number } = {};
    await Promise.all(
      groupNames.map(async (groupName: string) => {
        const { count } = await supabase
          .from("contacts")
          .select("*", { count: "exact", head: true })
          .eq("group", groupName);
        counts[groupName] = count || 0;
      })
    );
    setGroupCounts(counts);
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

  // Atualiza contatos ao digitar ou filtrar (com debounce)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchContacts(1, searchTerm, filterGroup); // Sempre volta para a página 1 ao filtrar
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, filterGroup]);

  // Carrega grupos e contagens ao montar
  useEffect(() => {
    fetchAllGroupsAndCounts();
  }, []);

  return (
    <>
      <AddContactModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContact(null); // Limpa o contato em edição
        }}
        onContactAdded={(page?: number) =>
          fetchContacts(page ?? currentPage, searchTerm, filterGroup)
        }
        contactToEdit={editingContact} // Passa o contato para o modal
        existingGroups={uniqueGroups.filter((g) => g !== "Todos")}
      />

      {/* Modal para renomear grupo */}
      {isRenameModalOpen && selectedGroupName && (
        <RenameGroupModal
          currentName={selectedGroupName}
          onSubmit={(newName) => handleRenameGroup(selectedGroupName, newName)}
          onClose={() => {
            setIsRenameModalOpen(false);
            setSelectedGroupName(null);
          }}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Lista de Contatos</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Contato
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
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
                ) : contacts.length > 0 ? (
                  contacts.map((contact) => {
                    const isSelected = selectedContactIds.includes(contact.id);
                    return (
                      <TableRow
                        key={contact.id}
                        className={isSelected ? "bg-muted" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              setSelectedContactIds((prev) =>
                                checked
                                  ? [...prev, contact.id]
                                  : prev.filter((id) => id !== contact.id)
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {contact.name}
                        </TableCell>
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
                    );
                  })
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
                Mostrando {contacts.length} de {totalContacts} contatos
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        if (currentPage > 1)
                          fetchContacts(
                            currentPage - 1,
                            searchTerm,
                            filterGroup
                          );
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
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
                          fetchContacts(
                            currentPage + 1,
                            searchTerm,
                            filterGroup
                          );
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
            <div className="bg-card p-6 rounded-lg shadow-sm">...</div>
          </div>
        </div>
        {/* ADICIONE ESTE NOVO BLOCO PARA A COLUNA DA DIREITA */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Grupos de Contatos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {uniqueGroups
                  .filter((g) => g !== "Todos" && g !== "Sem Grupo")
                  .map((group) => (
                    <div
                      key={group}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                    >
                      <span className="text-sm font-medium flex items-center gap-2">
                        {group}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setSelectedGroupName(group);
                            setIsRenameModalOpen(true);
                          }}
                          aria-label={`Renomear grupo ${group}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="text-destructive hover:text-destructive/80"
                          onClick={() => {
                            setGroupToDelete(group);
                            setIsDeleteModalOpen(true);
                          }}
                          aria-label={`Excluir grupo ${group}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </span>
                      <Badge variant="secondary">
                        {groupCounts[group] ?? 0}
                      </Badge>
                    </div>
                  ))}
                {/* Modal de confirmação de exclusão de grupo */}
                {isDeleteModalOpen && groupToDelete && (
                  <Dialog
                    open
                    onOpenChange={() => {
                      setIsDeleteModalOpen(false);
                      setGroupToDelete(null);
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Excluir Grupo</DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja excluir este grupo? Os contatos
                          associados permanecerão, mas serão removidos do grupo.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <button
                          className="px-4 py-2 border rounded bg-transparent text-foreground hover:bg-accent"
                          onClick={() => {
                            setIsDeleteModalOpen(false);
                            setGroupToDelete(null);
                          }}
                          type="button"
                        >
                          Cancelar
                        </button>
                        <button
                          className="px-4 py-2 bg-destructive text-white rounded hover:bg-destructive/90"
                          onClick={() => handleDeleteGroup(groupToDelete)}
                          type="button"
                        >
                          Excluir
                        </button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full hover:bg-zinc-200"
                  onClick={() => setIsCreateGroupModalOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar novo grupo
                </Button>
              </div>
              {/* Modal para criar novo grupo */}
              <CreateGroupModal
                isOpen={isCreateGroupModalOpen}
                onClose={() => setIsCreateGroupModalOpen(false)}
                onCreate={handleCreateGroup}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
