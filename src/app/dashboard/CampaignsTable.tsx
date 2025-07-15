"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

// Tipo para campanha
interface Campaign {
  id: number;
  created_at: string;
  status: string;
  total_recipients: number;
}

export default function CampaignsTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      setError(null);
      // Busca o usuário logado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Erro ao obter usuário logado.");
        setIsLoading(false);
        return;
      }
      // Busca campanhas filtrando pelo user_id
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, created_at, status, total_recipients")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        setError("Erro ao buscar campanhas.");
      } else {
        setCampaigns(data || []);
      }
      setIsLoading(false);
    };
    fetchCampaigns();
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campanhas</h1>
        <Link href="/dashboard/new">
          <Button className="bg-primary text-white">Nova campanha</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Minhas Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">Nenhuma campanha encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Data de criação
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Total de contatos
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {format(new Date(campaign.created_at), "dd/MM/yyyy")}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {campaign.status}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {campaign.total_recipients}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Link href={`/dashboard/reports/${campaign.id}`}>
                          <Button variant="outline" size="sm">
                            Ver detalhes
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
