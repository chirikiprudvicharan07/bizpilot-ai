/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#07090d",
        panel: "#111722",
        line: "rgba(255, 255, 255, 0.12)",
      },
    },
  },
  plugins: [],
};
