import type { Config } from "tailwindcss";

/**
 * Tailwind 配置 —— LifeBook 设计系统
 * 颜色 / 字体 / 圆角 / 阴影均通过 CSS 变量（globals.css）注入，便于浅色 / 深色模式切换。
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          light: "var(--color-primary-light)",
          dark: "var(--color-primary-dark)",
        },
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        background: "var(--color-bg-base)",
        card: "var(--color-bg-card)",
        elevated: "var(--color-bg-elevated)",
        hover: "var(--color-bg-hover)",
        foreground: "var(--color-text-primary)",
        muted: "var(--color-text-secondary)",
        subtle: "var(--color-text-tertiary)",
        disabled: "var(--color-text-disabled)",
        inverse: "var(--color-text-inverse)",
        border: "var(--color-border)",
        divider: "var(--color-divider)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-error)",
        info: "var(--color-info)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        soft: "var(--shadow-soft)",
        glow: "var(--shadow-glow)",
        "glow-lg": "var(--shadow-glow-lg)",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { boxShadow: "var(--shadow-glow-lg)", filter: "brightness(1)" },
          "50%": {
            boxShadow: "0 12px 44px rgba(122, 108, 240, 0.55)",
            filter: "brightness(1.06)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.18)" },
          "40%": { transform: "scale(0.94)" },
          "60%": { transform: "scale(1.1)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.3s ease-out",
        breathe: "breathe 3.4s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        heartbeat: "heartbeat 0.6s ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
