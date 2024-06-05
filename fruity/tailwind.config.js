/** @type {import('tailwindcss').Config} */

const safelist = [];
for (const color of ["red", "orange", "yellow", "lime", "emerald", "cyan", "blue", "violet", "fuchsia", "rose"]) {
  safelist.push(`from-${color}-200`);
  safelist.push(`to-${color}-400`);
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'kavoon': ['Kavoon', 'cursive'],
      },
    },
  },
  plugins: [],
  safelist: safelist,
}

