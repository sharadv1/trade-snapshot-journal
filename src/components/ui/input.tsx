
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // For number inputs, set the step to allow 5 decimal places
    const stepValue = type === "number" ? "0.00001" : undefined;
    
    return (
      <input
        type={type}
        step={stepValue}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm md:text-sm",
          className
        )}
        ref={ref}
        onChange={(e) => {
          // Special handling for numeric-type inputs
          if (type === "number" || props.inputMode === "decimal") {
            const value = e.target.value;
            
            // Allow empty, "." at the start, or "0." to support progressive typing of decimals
            if (value === "" || value === "." || value === "0." || /^-?(\d*\.?\d*)?$/.test(value)) {
              if (props.onChange) {
                props.onChange(e);
              }
              return;
            }
            
            // If the pattern above didn't match, prevent the default update by creating a new 
            // event with the previous value
            e.target.value = props.value?.toString() || '';
            return;
          }
          
          // Handle normal input change
          if (props.onChange) {
            props.onChange(e);
          }
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
