const baseConfig = require("../tailwind.config.js");
const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: [
    path.join(__dirname, "index.html"),
    path.join(__dirname, "src/**/*.{ts,tsx}"),
    path.join(__dirname, "../components/ui/**/*.{ts,tsx}"),
  ],
};
