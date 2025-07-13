// src/app/dashboard/reports/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

// Definimos os tipos para os dados que vamos buscar
type CampaignDetails = {
  id: number;
  message: string;
  status: string;
  total_recipients: number;
  created_at: string;
};
type DispatchLog = {
  id: number;
  contact_phone: string;
  status: "success" | "failed";
  error_reason: string | null;
};

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id;

  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [logs, setLogs] = useState<DispatchLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!campaignId) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      // Busca os detalhes da campanha
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      // Busca os logs de disparo para essa campanha
      const { data: logsData, error: logsError } = await supabase
        .from("dispatch_logs")
        .select("*")
        .eq("campaign_id", campaignId);

      if (campaignError || logsError) {
        toast.error("Erro ao buscar detalhes da campanha.");
      } else {
        setCampaign(campaignData);
        setLogs(logsData || []);
      }
      setIsLoading(false);
    };

    fetchDetails();
  }, [campaignId]);

  if (isLoading) {
    return (
      <div className="text-center">Carregando detalhes da campanha...</div>
    );
  }

  if (!campaign) {
    return <div className="text-center">Campanha não encontrada.</div>;
  }

  return (
    <div>
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Relatórios
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{campaign.status}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Destinatários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaign.total_recipients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground truncate">
              {campaign.message}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs de Disparo</CardTitle>
          <CardDescription>
            O resultado de cada envio individual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Status</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Motivo da Falha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {log.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {log.contact_phone}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.error_reason || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
