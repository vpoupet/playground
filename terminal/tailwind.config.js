/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'bg-diagonal-gradient': 'linear-gradient(45deg, #424242, #E0E0E0)', // Dark gray to light gray
      },
    },
  },
  plugins: [],
}

