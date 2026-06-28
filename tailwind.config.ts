import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F7F3EA",
        ink: "#18212B",
        open: "#18A558",
        official: "#F5B700",
        unclear: "#F97316",
        problem: "#F97316",
        blocked: "#DC2626",
        mapblue: "#2563EB",
        concrete: "#64748B",
      },
      boxShadow: {
        sheet: "0 -18px 60px rgba(24, 33, 43, 0.16)",
        float: "0 14px 40px rgba(24, 33, 43, 0.12)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
