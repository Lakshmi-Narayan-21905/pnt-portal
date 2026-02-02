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
                },
                'brand-green': {
                    ice: '#F2FCF5',      // Very Light Mint Background (Mildest Green)
                    light: '#D1F0DB',    // Light Green Accent
                    mint: '#6FCF97',     // Minty Green
                    primary: '#27AE60',  // Primary Green Button (Stripe Green-ish)
                    emerald: '#10B981',  // Emerald Green
                    deep: '#047857',     // Deep Green Text
                    dark: '#064E3B',     // Darkest Green
                },
                'brand-purple': {
                    ice: '#F3E8FF',      // Very Light Purple
                    light: '#E9D5FF',    // Light Purple
                    primary: '#9333EA',  // Purple 600
                    deep: '#6B21A8',     // Purple 800
                    dark: '#581C87',     // Purple 900
                },
                'brand-lavender': {
                    ice: '#F8F7FC',      // Very Light Lavender Background
                    light: '#EBE9F7',    // Light Lavender Accent
                    lilac: '#C4B5FD',    // Lilac Accent
                    primary: '#8B5CF6',  // Primary Violet Button (Tailwind Violet-500 equivalent)
                    purple: '#7C3AED',   // Purple
                    deep: '#6D28D9',     // Deep Violet Text
                    dark: '#5B21B6',     // Darkest Violet
                },
                'brand-orange': {
                    ice: '#FFF8F1',      // Very Light Cream
                    cream: '#FFF3E0',    // User provided light
                    light: '#FFE0B2',    // User provided accent
                    medium: '#FFB74D',   // User provided medium
                    primary: '#FB8C00',  // Strong Orange for buttons
                    deep: '#E65100',     // User provided dark (Text/Active)
                    rust: '#BF360C',     // Darkest Rust
                },
                'brand-indigo': {
                    ice: '#E6E8F0',      // User provided lightest
                    light: '#C7D2FE',    // Light Accent
                    soft: '#A5B4FC',     // Soft Indigo
                    primary: '#4F46E5',  // Indigo 600
                    deep: '#3730A3',     // Indigo 800
                    dark: '#1E1B4B',     // Indigo 950
                }
            },
        },
    },
    plugins: [],
}
