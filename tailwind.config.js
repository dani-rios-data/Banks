/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html"
    ],
    theme: {
      extend: {
        colors: {
          primary: '#1976d2',
          secondary: '#424242',
          background: '#f5f5f5',
          textColor: '#333333'
        }
      },
    },
    plugins: [],
  }