/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zions: {
          navy: '#002D5F',
          blue: '#0057A8',
          light: '#E8F0FE',
          accent: '#00A3E0',
          green: '#28A745',
          orange: '#F5A623',
          red: '#DC3545',
          gray: {
            50: '#F8F9FA',
            100: '#F1F3F5',
            200: '#E9ECEF',
            300: '#DEE2E6',
            400: '#ADB5BD',
            500: '#6C757D',
            600: '#495057',
            700: '#343A40',
            800: '#212529',
          }
        }
      }
    },
  },
  plugins: [],
}
