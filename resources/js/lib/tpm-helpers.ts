// This file contains helper functions used across the TPM application.

/**
 * Calculates a contrasting text color (black or white) for a given hex background color.
 * @param hexcolor The background color in '#RRGGBB' format.
 * @returns '#000000' (black) or '#FFFFFF' (white).
 */
export const getContrastColor = (hexcolor: string): string => {
  if (!hexcolor || hexcolor.length < 7) return '#000000';
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
};

/**
 * Returns the correct Tailwind CSS classes for the primary machine status badge.
 * @param status The machine status string (e.g., 'OPERATIONAL').
 * @returns A string of Tailwind classes.
 */
export const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'operational':
            return 'bg-green-100 text-green-800 border border-green-300';
        case 'out_of_service':
            return 'bg-red-100 text-red-800 border border-red-300';
        case 'New':
            return 'bg-blue-100 text-blue-800 border border-blue-300';
        default:
            return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
}