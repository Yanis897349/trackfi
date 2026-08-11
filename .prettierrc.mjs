/** @type {import("prettier").Config} */
export default {
  plugins: ["prettier-plugin-tailwindcss"],
  semi: false,
  singleQuote: false,
  tailwindStylesheet: "./packages/ui/src/styles/globals.css",
  trailingComma: "es5",
}
