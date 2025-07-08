// src/app/dashboard/page.tsx
'use client'; 

import { useState } from "react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ConnectWhatsAppModal from "@/components/dashboard/ConnectWhatsAppModal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarIcon, UploadCloud, Info, User } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from 'sonner';
import { useEffect } from 'react'; // Adicione ao import do 'react'
import { createClient } from '@/lib/supabaseClient';
import { Contact } from '@/types'; // Nosso tipo central de contato
import { Checkbox } from "@/components/ui/checkbox"; // O componente de caixa de seleção

export default function DashboardHomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleOption, setScheduleOption] = useState("now");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const supabase = createClient();
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  // Array com as cores de fundo que queremos usar (classes do Tailwind)
  const avatarColors = [
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-yellow-100 text-yellow-800',
    'bg-green-100 text-green-800',
    'bg-indigo-100 text-indigo-800',
    'bg-pink-100 text-pink-800',
  ];

  // Função que retorna uma cor aleatória do array com base no ID do contato
  const getRandomColor = (id: number) => {
    return avatarColors[id % avatarColors.length];
  };

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoadingContacts(true);
      const { data, error } = await supabase.from('contacts').select('*');
      if (data) {
        setAllContacts(data);
      }
      if (error) {
        toast.error("Erro ao carregar contatos.");
      }
      setIsLoadingContacts(false);
    };
    fetchContacts();
  }, []);

  const handleContactSelect = (contactId: number) => {
    setSelectedContacts(prevSelected =>
      prevSelected.includes(contactId)
        ? prevSelected.filter(id => id !== contactId)
        : [...prevSelected, contactId]
    );
  };

  // NOVA FUNÇÃO: Selecionar ou deselecionar todos os contatos
  const handleSelectAll = () => {
    if (selectedContacts.length === allContacts.length) {
      setSelectedContacts([]); // Se todos estão selecionados, deseleciona todos
    } else {
      setSelectedContacts(allContacts.map(c => c.id)); // Senão, seleciona todos
    }
  };
  
  // Estados para a lógica principal
  const [message, setMessage] = useState("");

  const handleVariableClick = (variable: string) => {
    setMessage((prevMessage) => prevMessage ? `${prevMessage} ${variable}` : variable);
  };

  // Lida com o clique no botão de envio principal
  const handleSendMessage = async () => {
    if (!message || selectedContacts.length === 0) {
      toast.error("Por favor, preencha a mensagem e selecione pelo menos um contato.");
      return;
    }

    const contactsToSend = allContacts.filter(contact => selectedContacts.includes(contact.id));
    const contactsCsv = contactsToSend.map(c => `${c.phone},${c.name},${c.group || ''}`).join('\n');

    toast.info(`Preparando envio para ${contactsToSend.length} contatos...`);
    try {
      const response = await fetch('http://localhost:3001/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, contacts: contactsCsv }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success("Campanha recebida!");
      } else {
        toast.error(result.error || "Erro no servidor.");
      }
    } catch (error) {
      toast.error("Falha ao conectar ao servidor de envio.");
    }
  };


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
        {/* Coluna Principal (2/3 da largura) */}
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
                  <Badge variant="secondary" className="cursor-pointer transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleVariableClick("{nome}")}>{"{nome}"}</Badge>
                  <Badge variant="secondary" className="cursor-pointer transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleVariableClick("{empresa}")}>{"{empresa}"}</Badge>
                  <Badge variant="secondary" className="cursor-pointer transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleVariableClick("{data}")}>{"{data}"}</Badge>
                  <Badge variant="secondary" className="cursor-pointer transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleVariableClick("{telefone}")}>{"{telefone}"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* === CARD DE SELECIONAR CONTATOS (VERSÃO SIMPLIFICADA E FOCADA) === */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Contatos para o Disparo</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Ferramentas de Seleção (Busca, Selecionar Todos, Contador) */}
              <div className="flex items-center justify-between mb-4">
                {/* Grupo de Controles na Esquerda */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      onCheckedChange={handleSelectAll}
                      checked={selectedContacts.length === allContacts.length && allContacts.length > 0}
                    />
                    <Label htmlFor="select-all" className="text-sm font-medium">Selecionar todos</Label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedContacts.length} de {allContacts.length} selecionados
                  </div>
                </div>

                {/* Barra de Busca na Direita */}
                <Input placeholder="🔍 Buscar contatos..." className="max-w-xs" />
              </div>

              {/* A Lista de Contatos */}
              <div className="border rounded-lg h-72 overflow-y-auto">
                {isLoadingContacts ? (
                  <p className="text-center text-sm text-muted-foreground p-4">Carregando contatos...</p>
                ) : allContacts.length > 0 ? (
                  allContacts.map((contact: Contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-4 p-3 border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`contact-${contact.id}`}
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={() => handleContactSelect(contact.id)}
                      />
                      <Label htmlFor={`contact-${contact.id}`} className="flex items-center gap-3 cursor-pointer flex-1">
                        {/* O Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRandomColor(contact.id)}`}>
                          <User className="h-5 w-5" />
                        </div>

                        {/* O Nome e Telefone */}
                        <div className="flex flex-col">
                          <span className="font-medium">{contact.name}</span>
                          <span className="text-xs text-muted-foreground">{contact.phone}</span>
                        </div>
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground p-4">Nenhum contato encontrado. Adicione na página 'Contatos'.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Agendamento (inalterado) */}
          <Card>
            <CardHeader>
              <CardTitle>Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={scheduleOption}
                onValueChange={setScheduleOption}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="now" id="r1" />
                  <Label htmlFor="r1">Enviar agora</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="later" id="r2" />
                  <Label htmlFor="r2">Agendar para depois</Label>
                </div>
              </RadioGroup>

              {scheduleOption === "later" && (
                <div className="mt-4 p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? (
                              format(date, "dd/MM/yyyy")
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>Hora</Label>
                      <Input type="time" defaultValue="12:30" />
                    </div>
                  </div>
                  <div>
                    <Label>Fuso horário</Label>
                    <Select defaultValue="gmt-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fuso horário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gmt-3">Brasília (GMT-3)</SelectItem>
                        <SelectItem value="gmt-4">Manaus (GMT-4)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral (1/3 da largura) - inalterada */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm">
                Olá {"{nome}"}, temos uma novidade especial para você!
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-4">
                Você pode personalizar sua mensagem usando variáveis como{" "}
                {"{nome}"} e {"{empresa}"}.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botões de Ação no Final - agora funcional */}
      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline">Salvar como rascunho</Button>
        <Button onClick={handleSendMessage}>Enviar mensagens</Button>
      </div>
    </>
  );
}