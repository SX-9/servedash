const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  plugins: [
    require("@catppuccin/tailwindcss"),
    plugin(function ({addVariant}) {
      addVariant('bar-empty', ['&::-webkit-progress-bar', '&']);
      addVariant('bar-full', ['&::-webkit-progress-value', '&::-moz-progress-bar', '&']);
      addVariant('bar', ['&::-webkit-progress-bar', '&::-webkit-progress-value', '&::-moz-progress-bar', '&']);
    }),
  ],
};