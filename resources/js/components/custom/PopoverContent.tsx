import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Define Popover styles with variants
const popoverVariants = cva(
  "z-50 w-72 rounded-md border p-4 shadow-md outline-none", // default classes
  {
    variants: {
      variant: {
        default: "bg-popover text-popover-foreground",
        glass: "bg-background/80 backdrop-blur-sm border-white/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface CustomPopoverContentProps extends React.ComponentPropsWithoutRef<typeof PopoverContent> {
  variant?: "default" | "glass"
}

export function CustomPopoverContent({ variant, className, ...props }: CustomPopoverContentProps) {
  return <PopoverContent className={cn(popoverVariants({ variant }), className)} {...props} />
}
