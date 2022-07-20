const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        paper: {
          600: "#606060",
          700: "#515151",
          800: "#424242",
          900: "#303030",
        },
        symbol: {
          placeholder: colors.gray[400],
          hint: colors.gray[400],
          disabled: colors.gray[400],
        },
        action: {
          hover: "rgb(255 255 255 / 0.08)",
          selected: "rgb(255 255 255 / 0.16)",
          disabled: "rgb(255 255 255 / 0.30)",
          focus: "rgb(255 255 255 / 0.12)",
        },
        primary: colors.blue,
        danger: colors.red,
        warning: colors.yellow,
        success: colors.green,
      },
    },
  },
  plugins: [],
};
