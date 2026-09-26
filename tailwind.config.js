/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-pink': '#E91E63', // Un colore rosa accattivante per l'accento
        'background-light': '#FCE4EC', // Rosa molto chiaro per lo sfondo generale
        'surface-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
}