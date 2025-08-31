import type { Config } from "tailwindcss";
export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors:{ panel:"var(--panel)", panel2:"var(--panel-2)", borderc:"var(--border)", textc:"var(--text)", primary:"var(--primary)", accent:"var(--accent)" },
    borderRadius:{ xl:"var(--radius)" },
    boxShadow:{ soft:"var(--shadow)" }
  } },
  plugins: []
} satisfies Config;
