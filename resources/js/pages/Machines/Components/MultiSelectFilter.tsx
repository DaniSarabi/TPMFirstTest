import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tag } from '@/types/maintenance';
import { Check, PlusCircle } from 'lucide-react';
import React from 'react';

// Define una opción de filtro genérica que puede manejar tanto strings como objetos
type FilterOption = {
    id: string | number;
    name: string;
    color?: string;
};

// Define las props para nuestro nuevo componente genérico
interface MultiSelectFilterProps {
    title?: string;
    options: FilterOption[];
    selectedValues: Set<string | number>;
    onSelectedValuesChange: (values: Set<string | number>) => void;
}

export function MultiSelectFilter({ title, options, selectedValues, onSelectedValuesChange }: MultiSelectFilterProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 border-dashed border-ring drop-shadow-lg">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {title}
                    {selectedValues.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                        {selectedValues.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selectedValues.has(option.id))
                                        .map((option) => (
                                            <Badge variant="secondary" key={option.id} className="rounded-sm px-1 font-normal capitalize">
                                                {option.name}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(option.id);
                                return (
                                    <CommandItem
                                        key={option.id}
                                        onSelect={() => {
                                            if (isSelected) {
                                                selectedValues.delete(option.id);
                                            } else {
                                                selectedValues.add(option.id);
                                            }
                                            onSelectedValuesChange(new Set(selectedValues));
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                                            )}
                                        >
                                            <Check className={cn('h-4 w-4')} />
                                        </div>
                                        <div className="flex items-center">
                                            {option.color && <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: option.color }} />}
                                            <span className="capitalize">{option.name}</span>
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {selectedValues.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem onSelect={() => onSelectedValuesChange(new Set())} className="justify-center text-center">
                                        Clear filters
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

