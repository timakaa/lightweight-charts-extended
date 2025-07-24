/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        modal: {
          DEFAULT: "#0F0F0F",
          border: "#2a2e39",
        },
      },
    },
  },
  plugins: [],
};
