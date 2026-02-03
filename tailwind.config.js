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
                    50: '#FAFAFA',
                    100: '#F5F5F5',
                    200: '#E5E5E5',
                    300: '#D4D4D4',
                    400: '#A3A3A3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    900: '#171717',
                },
                amber: {
                    black: '#000000',
                    brown: '#262626',
                    primary: '#525252',
                    light: '#A3A3A3',
                    dim: '#737373',
                    gold: '#525252',
                },
                brand: {
                    ice: '#FAFAFA',      // Background
                    light: '#F5F5F5',    // Light Accent
                    cyan: '#E5E5E5',     // Accent
                    primary: '#525252',  // Primary Buttons/Highlights
                    blue: '#404040',     // Secondary Brand
                    navy: '#171717',     // Text/Dark Elements
                    dark: '#262626',     // Darker
                },
                'brand-green': {
                    ice: '#FAFAFA',
                    light: '#F5F5F5',
                    mint: '#A3A3A3',
                    primary: '#525252',
                    emerald: '#404040',
                    deep: '#262626',
                    dark: '#171717',
                },
                'brand-purple': {
                    ice: '#FAFAFA',
                    light: '#F5F5F5',
                    primary: '#525252',
                    deep: '#262626',
                    dark: '#171717',
                },
                'brand-lavender': {
                    ice: '#FAFAFA',
                    light: '#F5F5F5',
                    lilac: '#D4D4D4',
                    primary: '#525252',
                    purple: '#404040',
                    deep: '#262626',
                    dark: '#171717',
                },
                'brand-orange': {
                    ice: '#FAFAFA',
                    cream: '#F5F5F5',
                    light: '#E5E5E5',
                    medium: '#A3A3A3',
                    primary: '#525252',
                    deep: '#262626',
                    rust: '#171717',
                },
                'brand-indigo': {
                    ice: '#FAFAFA',
                    light: '#F5F5F5',
                    soft: '#D4D4D4',
                    primary: '#525252',
                    deep: '#262626',
                    dark: '#171717',
                }
            },
        },
    },
    plugins: [],
}
