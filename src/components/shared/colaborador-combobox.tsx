'use client';

import { useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useColaboradores } from '@/lib/hooks/use-colaboradores';

interface ColaboradorComboboxProps {
  value: string | null | undefined;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ColaboradorCombobox({ value, onValueChange, placeholder = 'Seleccionar colaborador...', disabled }: ColaboradorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useColaboradores({ pageSize: 500, search: search.length >= 2 ? search : undefined });
  const items = data?.data ?? [];

  const selected = items.find((c) => c.id === value);

  const handleSelect = (id: string | null) => {
    onValueChange(id);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(''); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selected ? `${selected.legajo} - ${selected.nombre}` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full min-w-[300px] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Buscar por nombre o legajo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Results list */}
        <div className="max-h-[300px] overflow-y-auto p-1">
          {/* "Sin asignar" option */}
          <div
            role="option"
            aria-selected={!value}
            className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onClick={() => handleSelect(null)}
          >
            <Check className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
            Sin asignar
          </div>

          {items.length === 0 && search.length >= 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No se encontraron colaboradores.
            </div>
          )}

          {items.length === 0 && search.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Escriba al menos 2 caracteres...
            </div>
          )}

          {items.map((c) => (
            <div
              key={c.id}
              role="option"
              aria-selected={value === c.id}
              className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleSelect(c.id)}
            >
              <Check className={cn('mr-2 h-4 w-4', value === c.id ? 'opacity-100' : 'opacity-0')} />
              {c.legajo} - {c.nombre}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
