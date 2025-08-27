"use client"

import * as React from "react"
import { HexColorPicker } from "react-colorful"
import {
  PopoverCustom,
  PopoverTriggerCustom,
  PopoverContentCustom,
} from "@/components/custom/popoverCustom"
import { Button } from "@/components/ui/button"

export function ColorPickerPopover() {
  const [color, setColor] = React.useState("#aabbcc")

  return (
    <PopoverCustom>
      <PopoverTriggerCustom asChild>
        <Button
          variant="outline"
          className="w-10 h-10 rounded-md p-0"
          style={{ backgroundColor: color }}
        />
      </PopoverTriggerCustom>
      <PopoverContentCustom className="w-auto p-2">
        <HexColorPicker color={color} onChange={setColor} />
      </PopoverContentCustom>
    </PopoverCustom>
  )
}
