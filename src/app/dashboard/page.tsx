// src/app/dashboard/page.tsx
'use client'; 

import { useState, useRef } from "react"; // Adicionado 'useRef'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ConnectWhatsAppModal from "@/components/dashboard/ConnectWhatsAppModal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarIcon, UploadCloud, Info } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from 'sonner';
import Papa from "papaparse";

export default function DashboardHomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleOption, setScheduleOption] = useState("now");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [contacts, setContacts] = useState(""); 
  
  // Estados para a lógica principal
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file) {
      toast.error("Nenhum arquivo selecionado.");
      return;
    }
    if (file.type !== "text/csv") {
      toast.error("Formato de arquivo inválido. Por favor, selecione um arquivo .csv");
      return;
    }

    Papa.parse(file, {
      complete: (result) => {
        const nonEmptyRows = result.data.filter(row =>
          (row as string[]).some(cell => cell.trim() !== '')
        );
        const csvData = nonEmptyRows.map(row => (row as string[]).join(',')).join('\n');
        setContacts(csvData);
        toast.success(`${nonEmptyRows.length} contatos carregados do arquivo!`);
      },
      header: false
    });
  };

  const handleVariableClick = (variable: string) => {
    setMessage((prevMessage) => prevMessage ? `${prevMessage} ${variable}` : variable);
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

          {/* Card de Selecionar Contatos com a importação funcional */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Contatos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna da Esquerda: Placeholder e Textarea para contatos */}
              <div className="flex flex-col">
                <Input placeholder="🔍 Buscar contatos..." className="mb-4" />
                <div className="border rounded-lg p-4 h-48 overflow-y-auto">
                    <p className="text-sm text-center text-gray-500 pt-16">A lista de contatos salvos aparecerá aqui.</p>
                </div>
              </div>

              {/* Coluna da Direita: Ferramenta de Importação */}
              <div className="flex flex-col gap-4">
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={(e) => { if (e.target.files && e.target.files[0]) { handleFileSelect(e.target.files[0]); } }} />
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors h-full" onClick={() => fileInputRef.current?.click()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files && e.dataTransfer.files[0]) { handleFileSelect(e.dataTransfer.files[0]); } }} onDragOver={(e) => e.preventDefault()}>
                  <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-1">Arraste e solte um arquivo .csv</p>
                  <p className="text-xs text-gray-400 mb-2">ou</p>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Selecione um arquivo</Button>
                </div>
                <div><Label>Formato do arquivo</Label><Select defaultValue="csv"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="csv">CSV (Nome, Telefone, ...)</SelectItem><SelectItem value="xlsx" disabled>Excel (XLSX) - Em breve</SelectItem><SelectItem value="google" disabled>Google Contacts - Em breve</SelectItem></SelectContent></Select></div>
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
        <Button disabled>Enviar mensagens</Button>
      </div>
    </>
  );
}