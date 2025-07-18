import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          type="checkbox"
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute left-0 h-4 w-4 bg-blue-600 rounded-sm opacity-0 peer-checked:opacity-100 pointer-events-none" />
        <Check className="absolute left-0 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }