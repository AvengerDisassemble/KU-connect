/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: { extend: {
    fontFamily: {
      sans: ["Inter", "sans-serif"],      // general body
      poppins: ["Poppins", "sans-serif"], // headings, UI elements
      volkhov: ["Volkhov", "serif"],      // special text (quotes, highlights)
    },
  } },
  plugins: [],
}