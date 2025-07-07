// src/components/contacts/AddContactModal.tsx
'use client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddContactModal({ isOpen, onClose }: AddContactModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Contato</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (com DDD)</Label>
            <Input id="phone" placeholder="Ex: 11987654321" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group">Grupo (opcional)</Label>
            <Select>
                <SelectTrigger><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="vip">Clientes VIP</SelectItem>
                    <SelectItem value="regular">Clientes Regulares</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Etiquetas (opcional)</Label>
            <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Cliente <Button variant="ghost" size="icon" className="h-4 w-4 ml-1"><X className="h-3 w-3"/></Button></Badge>
                <Button variant="outline" size="sm">+ Adicionar</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Informações Adicionais</Label>
            <Textarea id="notes" placeholder="Observações sobre o contato..." />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="submit">Salvar Contato</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}