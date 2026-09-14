import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * 按钮 —— Art Direction 2.0（Apple 风胶囊按钮）。
 * default（渐变主按钮）/ cta（品牌呼吸按钮）/ secondary（玻璃次按钮）/
 * ghost（文字按钮）/ icon（图标按钮）
 * 按压反馈：98% 轻微下沉（active:scale-[0.98]），不抖动。
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-gradient-to-b from-primary-light to-primary-dark text-inverse shadow-glow ring-1 ring-inset ring-white/20 hover:brightness-105",
        cta: "rounded-full bg-gradient-to-r from-[#5b8def] via-[#7a6cf0] to-[#a06bf0] text-inverse shadow-glow-lg ring-1 ring-inset ring-white/25 animate-breathe",
        secondary:
          "rounded-full border border-primary/30 bg-card/60 text-primary backdrop-blur hover:bg-primary/5",
        ghost: "rounded-full text-primary hover:bg-hover",
        icon: "rounded-full text-foreground hover:bg-hover",
      },
      size: {
        default: "h-11 px-6 text-base",
        sm: "h-8 px-4 text-sm",
        lg: "h-12 px-8 text-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
