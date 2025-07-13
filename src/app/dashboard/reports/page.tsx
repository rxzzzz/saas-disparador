// src/app/dashboard/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Definimos um tipo para nossas campanhas
type Campaign = {
  id: number;
  created_at: string;
  message: string;
  total_recipients: number;
  status: string;
};

export default function ReportsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false }); // Ordena pelas mais recentes

      if (data) {
        setCampaigns(data);
      }
      setIsLoading(false);
    };

    fetchCampaigns();
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'partial_failure':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Relatório de Campanhas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Disparos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="text-center">Destinatários</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Carregando relatórios...</TableCell></TableRow>
              ) : campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      {format(new Date(campaign.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{campaign.message}</TableCell>
                    <TableCell className="text-center">{campaign.total_recipients}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusVariant(campaign.status) as any}>{campaign.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhuma campanha encontrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
