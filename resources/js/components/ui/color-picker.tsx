import { cn } from '@/lib/utils';

// Define the shape of a single color option in our palette
interface ColorOption {
    name: string;
    bgColor: string;
    textColor: string;
}

// Define the full palette of accessible color combinations
export const colorPalette: ColorOption[] = [
    // ROW 1 – Soft Colors
  { name: 'SoftGreen', bgColor: '#69fec3', textColor: '#04160e' },
  { name: 'SoftBlue',  bgColor: '#5fcfdd', textColor: '#031011' },
  { name: 'SoftYellow',bgColor: '#ffce69', textColor: '#170f04' },
  { name: 'SoftRedish',bgColor: '#ff9282', textColor: '#180706' },
  { name: 'SoftBrown', bgColor: '#826a5c', textColor: '#e5e0dd' },
  { name: 'SoftGray',  bgColor: '#f3f4f6', textColor: '#1f2937' },

  // ROW 2 – Acid / Bright
  { name: 'AcidGreen', bgColor: '#00fa96', textColor: '#001607' },
  { name: 'AcidBlue',  bgColor: '#00d4ff', textColor: '#00252c' },
  { name: 'AcidYellow',bgColor: '#ffe600', textColor: '#4a4000' },
  { name: 'AcidRedish',bgColor: '#ff4e4e', textColor: '#1a0000' },
  { name: 'AcidPurple',bgColor: '#d6a7ff', textColor: '#3f1d54' },
  { name: 'AcidOrange',bgColor: '#ffab4e', textColor: '#432000' },

  // ROW 3 – Dark / Regular
  { name: 'DarkGreen', bgColor: '#00a96e', textColor: '#000000' },
  { name: 'DarkBlue',  bgColor: '#0075bf', textColor: '#000000' },
  { name: 'DarkYellow',bgColor: '#ffbf00', textColor: '#000000' },
  { name: 'DarkRedish',bgColor: '#ff6368', textColor: '#000000' },
  { name: 'DarkGray',  bgColor: '#000000', textColor: '#ffffff' },
  { name: 'DarkBrown', bgColor: '#4b3621', textColor: '#e6d3b3' },

  // ROW 4 – Random / Wild
  { name: 'Mint',   bgColor: '#b6fcd5', textColor: '#063a2d' },
  { name: 'Sky',    bgColor: '#c6ecff', textColor: '#1a3a47' },
  { name: 'Lilac',  bgColor: '#e0bbff', textColor: '#3e2450' },
  { name: 'Rose',   bgColor: '#ffc8dd', textColor: '#3b0c1f' },
  { name: 'Teal',   bgColor: '#008080', textColor: '#ffffff' },
  { name: 'Beige',  bgColor: '#f5f5dc', textColor: '#2c2c1c' },
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
        <div className="grid grid-cols-6 gap-2">
            {colorPalette.map((color) => {
                const isSelected = value.bgColor === color.bgColor;
                return (
                    <button
                        key={color.name}
                        type="button"
                        onClick={() => onChange({ bgColor: color.bgColor, textColor: color.textColor })}
                        className={cn(
                            'h-8 w-8 rounded-lg border-2 flex items-center justify-center transition-transform hover:scale-140',
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
