import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface RenameGroupModalProps {
  currentName: string;
  onSubmit: (newName: string) => void;
  onClose: () => void;
}

const RenameGroupModal: React.FC<RenameGroupModalProps> = ({
  currentName,
  onSubmit,
  onClose,
}) => {
  const [newName, setNewName] = useState(currentName);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>Renomear Grupo</DialogTitle>
        </DialogHeader>
        <input
          className="w-full border rounded px-3 py-2 mb-4"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <DialogFooter>
          <button
            className="px-4 py-2 border rounded bg-transparent text-foreground hover:bg-accent"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
            onClick={() => onSubmit(newName)}
            disabled={!newName.trim()}
            type="button"
          >
            Salvar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameGroupModal;
