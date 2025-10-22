import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // --- ADDED GRADIENT VARIANT ---
        // NOTE: Replace the colors 'from-blue-500 to-purple-600' with your Reflectiq logo's actual gradient colors.
        gradient: "bg-gradient-to-r from-[#4BBEBB] to-[#016BFF}] text-white shadow-lg hover:from-blue-600 hover:to-purple-700 focus-visible:ring-blue-300",
      },
      size: {
        default: "h-10 px-5 py-2", // SLIGHTLY INCREASED default size (h-9 -> h-10, px-4 -> px-5)
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base", // SLIGHTLY INCREASED lg size (h-10 -> h-11)
        // --- ADDED EXTRA-LARGE (XL) SIZE ---
        xl: "h-12 rounded-lg px-10 text-lg",
        icon: "size-10", // SLIGHTLY INCREASED icon size (size-9 -> size-10)
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }