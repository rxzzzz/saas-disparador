'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ComboboxOption { value: string; label: string; }

interface CreatableComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  createPlaceholder?: string;
}

export function CreatableCombobox({ options, value, onChange, placeholder = "Selecione...", searchPlaceholder = "Buscar...", emptyPlaceholder = "Nenhum resultado.", createPlaceholder = "Criar" }: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const handleSelect = (selectedValue: string) => { onChange(selectedValue); setOpen(false); };
  const handleCreate = () => { if (inputValue) { onChange(inputValue); setOpen(false); } };
  const displayedLabel = options.find(option => option.value.toLowerCase() === value?.toLowerCase())?.label || value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {value ? displayedLabel : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
          <CommandInput placeholder={searchPlaceholder} onValueChange={setInputValue} />
          <CommandList><CommandEmpty>
              <div className="py-4 px-2 text-center text-sm">{emptyPlaceholder}
                  <Button variant="ghost" className="w-full mt-2" onClick={handleCreate}><PlusCircle className="mr-2 h-4 w-4" />{createPlaceholder} "{inputValue}"</Button>
              </div>
          </CommandEmpty><CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={option.value} onSelect={() => handleSelect(option.value)}>
                  <Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />{option.label}
                </CommandItem>
              ))}
          </CommandGroup></CommandList>
      </Command></PopoverContent>
    </Popover>
  );
}
