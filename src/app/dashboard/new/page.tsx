// src/app/dashboard/new/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ConnectWhatsAppModal from "@/components/dashboard/ConnectWhatsAppModal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  CalendarIcon,
  UploadCloud,
  Info,
  User,
  Users,
  Loader2,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { useEffect } from "react"; // Adicione ao import do 'react'
import { createClient } from "@/lib/supabaseClient";
import { Contact } from "@/types"; // Nosso tipo central de contato
import { Checkbox } from "@/components/ui/checkbox"; // O componente de caixa de seleção

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function DashboardHomePage() {
  const [isCampaignSending, setIsCampaignSending] = useState(false);
  // Estado para agendamento
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  // ...existing code...
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [message, setMessage] = useState("");
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 10 contatos por página
  const [totalContacts, setTotalContacts] = useState(0);
  // Pré-visualização dinâmica da mensagem
  const previewContact = allContacts[0] || {
    name: "Exemplo",
    phone: "5511999999999",
    group: "VIP",
  };
  const previewMessage = message
    ? message
        .replace(/{nome}/gi, previewContact.name || "")
        .replace(/{telefone}/gi, previewContact.phone || "")
        .replace(/{grupo}/gi, previewContact.group || "")
    : "";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleOption, setScheduleOption] = useState("now");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const supabase = createClient();

  // Estado global de grupos únicos
  const [uniqueGroups, setUniqueGroups] = useState<string[]>([]);

  // Array com as cores de fundo que queremos usar (classes do Tailwind)
  const avatarColors = [
    "bg-blue-100 text-blue-800",
    "bg-purple-100 text-purple-800",
    "bg-yellow-100 text-yellow-800",
    "bg-green-100 text-green-800",
    "bg-indigo-100 text-indigo-800",
    "bg-pink-100 text-pink-800",
  ];

  // Função que retorna uma cor aleatória do array com base no ID do contato
  const getRandomColor = (id: number) => {
    return avatarColors[id % avatarColors.length];
  };

  // Função de busca paginada
  const fetchContacts = async (page = 1) => {
    setIsLoadingContacts(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Busca paginada
    const { data, error, count } = await supabase
      .from("contacts")
      .select("*", { count: "exact" })
      .range(from, to);

    if (data) {
      setAllContacts(data);
      setTotalContacts(count || 0);
      setCurrentPage(page);
    }
    if (error) {
      toast.error("Erro ao carregar contatos.");
    }
    setIsLoadingContacts(false);
  };

  // searchTerm precisa ser declarado antes do useEffect
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Busca a primeira página de contatos
    fetchContacts(1);

    // Busca todos os grupos únicos existentes
    const fetchAllGroups = async () => {
      const { data, error } = await supabase.from("contacts").select("group");
      if (data) {
        const groups = [
          ...(new Set(data.map((c) => c.group).filter(Boolean)) as Set<string>),
        ];
        setUniqueGroups(groups);
      }
    };
    fetchAllGroups();
  }, [searchTerm]);

  const handleContactSelect = (contactId: number) => {
    setSelectedContacts((prevSelected) =>
      prevSelected.includes(contactId)
        ? prevSelected.filter((id) => id !== contactId)
        : [...prevSelected, contactId]
    );
  };

  // NOVA FUNÇÃO: Selecionar ou deselecionar todos os contatos
  const handleSelectAll = async () => {
    toast.info("Buscando todos os contatos para seleção...");

    // Constrói a query de busca, mas sem paginação, para pegar todos os IDs
    let query = supabase.from("contacts").select("id");

    if (searchTerm) {
      query = query.or(
        `name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      );
    }

    const { data: allMatchingContacts, error } = await query;

    if (error) {
      toast.error("Erro ao buscar todos os contatos.");
      return;
    }

    if (allMatchingContacts) {
      const allIds = allMatchingContacts.map((c) => c.id);

      // Verifica se todos os IDs encontrados já estão na seleção
      const areAllSelected = allIds.every((id) =>
        selectedContacts.includes(id)
      );

      if (areAllSelected) {
        // Deseleciona todos os contatos encontrados
        setSelectedContacts((prev) =>
          prev.filter((id) => !allIds.includes(id))
        );
        toast.success(
          "Todos os contatos correspondentes foram deselecionados."
        );
      } else {
        // Seleciona todos os contatos encontrados (sem duplicatas)
        setSelectedContacts((prev) => [...new Set([...prev, ...allIds])]);
        toast.success(
          `${allIds.length} contatos selecionados em todas as páginas.`
        );
      }
    }
  };

  // Função para selecionar/deselecionar todos os contatos de um grupo (global)
  const handleGroupSelect = async (groupName: string) => {
    toast.info(`Processando grupo "${groupName}"...`);
    const { data, error } = await supabase
      .from("contacts")
      .select("id")
      .eq("group", groupName);

    if (error || !data) {
      toast.error(`Erro ao buscar contatos do grupo "${groupName}".`);
      return;
    }

    const contactIdsInGroup = data.map((c) => c.id);
    const areAllSelected = contactIdsInGroup.every((id) =>
      selectedContacts.includes(id)
    );

    if (areAllSelected) {
      setSelectedContacts((prev) =>
        prev.filter((id) => !contactIdsInGroup.includes(id))
      );
      toast.success(`Contatos do grupo "${groupName}" removidos da seleção.`);
    } else {
      setSelectedContacts((prev) => [
        ...new Set([...prev, ...contactIdsInGroup]),
      ]);
      toast.success(
        `${contactIdsInGroup.length} contatos do grupo "${groupName}" adicionados.`
      );
    }
  };

  // Estados para a lógica principal
  // const [message, setMessage] = useState("");

  const handleVariableClick = (variable: string) => {
    setMessage((prevMessage) =>
      prevMessage ? `${prevMessage} ${variable}` : variable
    );
  };

  // Lida com o clique no botão de envio principal
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("A mensagem não pode estar vazia.");
      return;
    }
    if (selectedContacts.length === 0) {
      toast.error("Selecione pelo menos um contato para o disparo.");
      return;
    }

    // 1. Busca os dados do usuário logado
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sessão expirada. Por favor, faça o login novamente.");
      return;
    }

    const contactsToSend = allContacts.filter((contact) =>
      selectedContacts.includes(contact.id)
    );
    const contactsCsv = contactsToSend
      .map((c) => `${c.phone},${c.name},${c.group || ""}`)
      .join("\n");

    toast.info(`Preparando envio para ${contactsToSend.length} contatos...`);

    try {
      const response = await fetch("http://localhost:3001/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 2. Adiciona o userId ao corpo da requisição
        body: JSON.stringify({
          message,
          contacts: contactsCsv,
          userId: user.id,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Campanha registrada! O envio começou.");
      } else {
        toast.error(result.error || "Erro no servidor.");
      }
    } catch (error) {
      toast.error("Falha ao conectar ao servidor de envio.");
    }
  };

  // ...existing code...
  const filteredContacts = allContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm)
  );

  return (
    <>
      <ConnectWhatsAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Novo Disparo</h1>
        <Button onClick={() => setIsModalOpen(true)}>Conectar WhatsApp</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna da Esquerda */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Mensagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Assunto</Label>
                <Input placeholder="Ex: Promoção especial" />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Digite sua mensagem aqui ou clique em uma variável abaixo..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block">Variáveis personalizadas</Label>
                <div className="flex gap-2">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    onClick={() => handleVariableClick("{nome}")}
                  >
                    {"{nome}"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    onClick={() => handleVariableClick("{empresa}")}
                  >
                    {"{empresa}"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    onClick={() => handleVariableClick("{data}")}
                  >
                    {"{data}"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    onClick={() => handleVariableClick("{telefone}")}
                  >
                    {"{telefone}"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Selecionar Contatos (fundido com grupos) */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Contatos</CardTitle>
            </CardHeader>
            <CardContent>
              <>
                {/* Barra de Ferramentas */}
                <div className="flex items-center mb-4">
                  {/* Placeholder para os controles da esquerda */}
                  <div id="toolbar-left">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        onCheckedChange={handleSelectAll}
                        checked={
                          totalContacts > 0 &&
                          selectedContacts.length === totalContacts
                        }
                      />
                      <Label htmlFor="select-all">Selecionar todos</Label>
                    </div>
                  </div>
                  {/* Placeholder para a busca da direita */}
                  <div id="toolbar-right"></div>
                </div>

                {/* Conteúdo Principal com Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Coluna da Esquerda: Lista de Contatos */}
                  <div className="lg:col-span-2" id="contact-list-column">
                    <Input
                      placeholder="🔍 Buscar contatos..."
                      className="mb-4"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="border rounded-lg h-72 overflow-y-auto">
                      {isLoadingContacts ? (
                        <p className="text-center p-4">Carregando...</p>
                      ) : allContacts.length > 0 ? (
                        filteredContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center gap-3 p-3 border-b last:border-b-0"
                          >
                            <Checkbox
                              id={`c-${contact.id}`}
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={() =>
                                handleContactSelect(contact.id)
                              }
                            />
                            <Label
                              htmlFor={`c-${contact.id}`}
                              className="flex items-center gap-3 cursor-pointer flex-1"
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${getRandomColor(
                                  contact.id
                                )}`}
                              >
                                <User className="h-5 w-5" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {contact.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {contact.phone}
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-center p-4">
                          Nenhum contato encontrado.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        {selectedContacts.length} de {totalContacts}{" "}
                        selecionados
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1)
                                  fetchContacts(currentPage - 1);
                              }}
                              className={
                                currentPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                          <PaginationItem>
                            <span className="text-sm px-4">
                              Página {currentPage} de{" "}
                              {Math.ceil(totalContacts / pageSize)}
                            </span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (
                                  currentPage <
                                  Math.ceil(totalContacts / pageSize)
                                )
                                  fetchContacts(currentPage + 1);
                              }}
                              className={
                                currentPage >=
                                Math.ceil(totalContacts / pageSize)
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>

                  {/* Coluna da Direita: Grupos */}
                  <div className="lg:col-span-1" id="group-list-column">
                    <Label>Seleção Rápida por Grupo</Label>
                    <div className="mt-2 space-y-2">
                      {isLoadingContacts ? (
                        <p className="text-sm text-muted-foreground">
                          Carregando...
                        </p>
                      ) : uniqueGroups.length > 0 ? (
                        uniqueGroups.map((group) => (
                          <div
                            key={group}
                            onClick={() => handleGroupSelect(group)}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {group}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground pt-2">
                          Nenhum grupo criado.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            </CardContent>
          </Card>

          {/* Card de Opções de envio - NOVO AGENDAMENTO */}
          <div className="w-full mt-12 mb-8">
            <Card className="border rounded-lg shadow-sm p-6">
              <CardHeader className="pb-2 px-0">
                <CardTitle className="text-lg">Opções de envio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0 px-0">
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="now"
                      checked={scheduleType === "now"}
                      onChange={() => setScheduleType("now")}
                      className="accent-primary"
                    />
                    <span className="text-sm">Enviar agora</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="later"
                      checked={scheduleType === "later"}
                      onChange={() => setScheduleType("later")}
                      className="accent-primary"
                    />
                    <span className="text-sm">Agendar para depois</span>
                  </label>
                </div>
                {scheduleType === "later" && (
                  <div className="mt-4">
                    <label
                      htmlFor="scheduledAt"
                      className="block text-sm font-medium mb-1"
                    >
                      Escolha a data e hora
                    </label>
                    <input
                      id="scheduledAt"
                      type="datetime-local"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Coluna da Direita */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <p className="text-sm text-green-900 dark:text-green-200">
                  {previewMessage ||
                    "A pré-visualização da sua mensagem aparecerá aqui..."}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta é uma pré-visualização usando o primeiro contato da sua
                lista como exemplo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botões de Ação no Final - agora funcional */}
      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline">Salvar como rascunho</Button>
        <Button onClick={handleSendMessage} disabled={isCampaignSending}>
          {isCampaignSending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isCampaignSending ? "Enviando..." : "Enviar mensagens"}
        </Button>
      </div>
    </>
  );
}
