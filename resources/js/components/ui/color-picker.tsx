import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import * as React from 'react';

// Define the shape of a single color option in our palette
interface ColorOption {
    name: string;
    bgColor: string;
    textColor: string;
}

// Define the full palette of accessible color combinations
export const colorPalette: ColorOption[] = [
    { name: 'Green', bgColor: '#69fec3', textColor: '#04160e' },
    { name: 'Blue', bgColor: '#5fcfdd', textColor: '#031011' },
    { name: 'Yellow', bgColor: '#ffce69', textColor: '#170f04' },
    { name: 'Redish', bgColor: '#ff9282', textColor: '#180706' },
    { name: 'Purple', bgColor: '#8c4fff', textColor: '#e3cee4' },
    { name: 'Brown', bgColor: '#826a5c', textColor: '#e5e0dd' },
    { name: 'Gray', bgColor: '#f3f4f6', textColor: '#1f2937' },

    { name: 'Green', bgColor: '#00a96e', textColor: '#000000' },
    { name: 'Blue', bgColor: '#0075bf', textColor: '#000000' },
    { name: 'Yellow', bgColor: '#ffbf00', textColor: '#000000' },
    { name: 'Redish', bgColor: '#ff6368', textColor: '#000000' },
    { name: 'Purple', bgColor: '#6d0076', textColor: '#e3cee4' },
    { name: 'Brown', bgColor: '#56524c', textColor: '#e5e0dd' },
    { name: 'Gray', bgColor: '#000000', textColor: '#ffffff' },

    { name: 'Green', bgColor: '#6bb187', textColor: '#040b07' },
    { name: 'Blue', bgColor: '#0291d5', textColor: '#000710' },
    { name: 'Yellow', bgColor: '#dbae5a', textColor: '#110b03' },
    { name: 'Redish', bgColor: '#ac3e31', textColor: '#f2d8d4' },
    { name: 'Purple', bgColor: '#2f2982', textColor: '#e3cee4' },
    { name: 'Brown', bgColor: '#7c909a', textColor: '#050708' },
    { name: 'Gray', bgColor: '#61738d', textColor: '#ffffff' },
];

// Define the props for our new component
interface ColorPickerProps {
    value: {
        bgColor: string;
        textColor: string;
    };
    onChange: (colors: { bgColor: string; textColor: string }) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    return (
        <div className="grid grid-cols-7 gap-2">
            {colorPalette.map((color) => {
                const isSelected = value.bgColor === color.bgColor;
                return (
                    <button
                        key={color.name}
                        type="button"
                        onClick={() => onChange({ bgColor: color.bgColor, textColor: color.textColor })}
                        className={cn(
                            'h-8 w-8 rounded-lg border-2 flex items-center justify-center transition-transform hover:scale-110',
                            isSelected ? 'border-black' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color.bgColor }}
                        aria-label={`Select ${color.name}`}
                    >
                        <span
                            className="text-lg font-bold"
                            style={{ color: color.textColor }}
                        >
                            A
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
