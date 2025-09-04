import { Box, CalendarClock, CalendarX, HelpCircle, ListChecks, PowerOff, RotateCw, ShieldCheck, Ticket, Wrench } from 'lucide-react';
import React from 'react';

// This component uses a map of specifically imported icons for better
// performance and type safety.
interface DynamicLucideIconProps {
  name: string | null;
  className?: string;
}

// Create a map of the imported icons.
// To use a new icon, you must import it above and add it to this map.
const iconMap: { [key: string]: React.ElementType } = {
  PowerOff,
  Ticket,
  Box,
  Wrench,
  CalendarClock,
  CalendarX,
  HelpCircle,
  ListChecks,
  RotateCw,
  ShieldCheck,
};

const DynamicLucideIcon: React.FC<DynamicLucideIconProps> = ({ name, className }) => {
  if (!name) {
    return null;
  }
  const LucideIcon = iconMap[name];

  if (!LucideIcon) {
    // Fallback to a default icon if the name doesn't match our map.
    return <HelpCircle className={className} />;
  }

  return <LucideIcon className={className} />;
};

export default DynamicLucideIcon;
