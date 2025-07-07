// src/app/dashboard/contacts/page.tsx
'use client'; // Necessário para controlar o estado do modal

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import AddContactModal from '@/components/contacts/AddContactModal'; // Vamos criar a seguir

export default function ContactsPage() {
  // Estado para controlar a abertura do modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dados de exemplo para preencher a tabela
  const exampleContacts = [
    { name: 'Maria Souza', phone: '+55 11 98765-4321', group: 'Clientes VIP', tags: ['Cliente', 'Ativo'] },
    { name: 'Carlos Oliveira', phone: '+55 21 99876-5432', group: '-', tags: ['Prospecção'] },
    { name: 'Ana Santos', phone: '+55 31 98765-1234', group: 'Clientes Regulares', tags: ['Cliente'] },
  ];

  return (
    <>
      <AddContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onContactAdded={() => {}} />

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
            {exampleContacts.map((contact, index) => (
              <TableRow key={index}>
                <TableCell><Checkbox /></TableCell>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>{contact.group}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {contact.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                  </div>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
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