
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, ...props }, ref) => {
    // Create a handler to ensure changes propagate correctly
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      console.log("Textarea change detected:", e.target.value.substring(0, 20) + (e.target.value.length > 20 ? "..." : ""));
      
      // IMPORTANT: Create a new event object to ensure the target value is preserved
      // This fixes the issue with React's synthetic events being reused
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: e.target.value
        }
      };
      
      if (onChange) {
        onChange(syntheticEvent);
      }
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
