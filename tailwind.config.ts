import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1.5rem",
        "2xl": "2rem",
        "3xl": "3rem",
      },
      colors: {
        background: "hsl(220, 26%, 5%)",
        foreground: "hsl(0, 0%, 93%)",
        card: {
          DEFAULT: "hsla(220, 26%, 8%, 0.4)",
          foreground: "hsl(0, 0%, 93%)",
        },
        popover: {
          DEFAULT: "hsla(220, 26%, 8%, 0.4)",
          foreground: "hsl(0, 0%, 93%)",
        },
        primary: {
          DEFAULT: "hsl(263, 82%, 58%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(220, 26%, 10%)",
          foreground: "hsl(0, 0%, 93%)",
        },
        muted: {
          DEFAULT: "hsla(220, 26%, 9%, 0.4)",
          foreground: "hsl(220, 20%, 65%)",
        },
        accent: {
          DEFAULT: "hsl(220, 40%, 60%)",
          foreground: "hsl(0, 0%, 10%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 62.8%, 40%)",
          foreground: "hsl(0, 0%, 98%)",
        },
        border: "hsla(220, 26%, 30%, 0.3)",
        input: "hsla(220, 26%, 30%, 0.3)",
        ring: "hsl(263, 82%, 58%)",
        glass: {
          DEFAULT: "hsla(220, 26%, 10%, 0.4)",
          border: "hsla(220, 26%, 30%, 0.3)",
          hover: "hsla(220, 26%, 15%, 0.5)",
          light: "hsla(0, 0%, 100%, 0.1)",
        },
        chart: {
          "1": "hsl(263, 82%, 58%)",
          "2": "hsl(220, 40%, 60%)",
          "3": "hsl(0, 62.8%, 40%)",
          "4": "hsl(158, 64%, 52%)",
          "5": "hsl(43, 96%, 56%)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 0 0px hsla(263, 82%, 58%, 0.4)",
          },
          "50%": {
            boxShadow: "0 0 0 8px hsla(263, 82%, 58%, 0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "16px",
        xl: "24px",
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(135deg, hsla(263, 82%, 58%, 0.15) 0%, hsla(220, 40%, 60%, 0.05) 100%)",
        "dark-overlay":
          "linear-gradient(180deg, hsla(0, 0%, 0%, 0.3) 0%, hsla(0, 0%, 0%, 0.1) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
