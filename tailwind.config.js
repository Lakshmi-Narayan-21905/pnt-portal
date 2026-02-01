/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#b9e6fe',
                    300: '#7cd3fd',
                    400: '#36bffa',
                    500: '#0ca5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                amber: {
                    black: '#040706',
                    brown: '#5B1707',
                    primary: '#CF5E02',
                    light: '#F4B028',
                    dim: '#D87E0A',
                    gold: '#DC940F',
                },
                brand: {
                    ice: '#EDF3FB',      // Background
                    light: '#CAF0F8',    // Light Accent
                    cyan: '#90E0EF',     // Cyan Accent
                    primary: '#00B4D8',  // Primary Buttons/Highlights
                    blue: '#0077B6',     // Secondary Brand
                    navy: '#03045E',     // Text/Dark Elements
                    dark: '#023E8A',     // Darker Blue
                }
            },
        },
    },
    plugins: [],
}
