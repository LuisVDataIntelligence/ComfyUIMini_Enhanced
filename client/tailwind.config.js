/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,js,ts,vue}",
    ],
    theme: {
        extend: {
            fontFamily: {
                nebula: ['NebulaSans', 'sans-serif']
            }
        },
    },
    plugins: [],
};