import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // For number inputs, set the step to allow 5 decimal places
    const stepValue = type === "number" ? "0.00001" : undefined;
    
    // Special handling for numeric inputs to better support decimal values
    const handleDecimalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === "number" || props.inputMode === "decimal") {
        const value = e.target.value;
        
        // Allow empty string, decimal point, or "0." for progressive typing
        if (value === "" || value === "." || value === "0." || /^-?\d*\.?\d*$/.test(value)) {
          // Let the input event proceed
          return;
        }
        
        // Otherwise prevent the change
        e.preventDefault();
      }
    };
    
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
          handleDecimalInput(e);
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
