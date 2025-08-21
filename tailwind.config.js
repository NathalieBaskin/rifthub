/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "rift-bg": "#0f1624",
        "rift-card": "#141c2b",
        "rift-gold": "#d9b260",
      },
      borderRadius: {
        xl2: "1rem",
      },
      boxShadow: {
        aura: "0 0 25px rgba(217,178,96,0.15)",
      },
      dropShadow: {
        glow: "0 0 10px rgba(217,178,96,0.6)",
      },
      fontFamily: {
        display: ["LoL", "ui-serif", "Georgia", "serif"],
        body: ["Spiegel", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
