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
import { CalendarIcon, UploadCloud, Info } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function DashboardHomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleOption, setScheduleOption] = useState("now");
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // === NOVO ESTADO ADICIONADO AQUI ===
  const [message, setMessage] = useState("");

  // === NOVA FUNÇÃO ADICIONADA AQUI ===
  const handleVariableClick = (variable: string) => {
    // Adiciona a variável ao final do texto existente, com um espaço
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
          {/* === CARD DE CONFIGURAR MENSAGEM MODIFICADO === */}
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
                {/* O Textarea agora está conectado ao nosso estado */}
                <Textarea
                  placeholder="Digite sua mensagem aqui ou clique em uma variável abaixo..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block">Variáveis personalizadas</Label>
                {/* Os Badges agora são clicáveis */}
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
          {/* === FIM DO CARD DE CONFIGURAR MENSAGEM MODIFICADO === */}

          {/* === NOVO CARD DE SELECIONAR/IMPORTAR CONTATOS === */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Contatos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna da Esquerda: Seleção de Contatos (Placeholder) */}
              <div className="flex flex-col">
                <Input placeholder="🔍 Buscar contatos..." className="mb-4" />
                <div className="border rounded-lg p-4 h-64 overflow-y-auto">
                  <p className="text-sm text-center text-gray-500 pt-20">
                    A lista de contatos salvos aparecerá aqui.
                  </p>
                </div>
              </div>

              {/* Coluna da Direita: Importação de Contatos */}
              <div className="flex flex-col gap-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center flex flex-col items-center justify-center">
                  <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 mb-2">
                    Arraste e solte um arquivo aqui
                  </p>
                  <p className="text-xs text-gray-400 mb-4">ou</p>
                  <Button variant="outline">Selecione um arquivo</Button>
                </div>
                <div>
                  <Label>Formato do arquivo</Label>
                  <Select defaultValue="csv">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">
                        CSV (Nome, Telefone, ...)
                      </SelectItem>
                      <SelectItem value="xlsx" disabled>
                        Excel (XLSX) - Em breve
                      </SelectItem>
                      <SelectItem value="google" disabled>
                        Google Contacts - Em breve
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <p>Formatos suportados: CSV, XLSX, XLS</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <p>
                      Certifique-se de incluir colunas para nome e telefone.
                    </p>
                  </div>
                </div>
                <Button className="w-full">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Importar contatos
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* === FIM DO NOVO CARD === */}

          {/* Card de Agendamento */}
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

        {/* Coluna Lateral (1/3 da largura) */}
        <div className="lg:col-span-1">
          {/* Card de Pré-visualização */}
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

      {/* Botões de Ação no Final */}
      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline">Salvar como rascunho</Button>
        <Button>Enviar mensagens</Button>
      </div>
    </>
  );
}