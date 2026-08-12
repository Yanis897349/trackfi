import { compile } from "@inlang/paraglide-js"

await compile({
  project: "../../packages/localization/project.inlang",
  outdir: "./src/paraglide",
  strategy: ["url", "localStorage", "preferredLanguage", "baseLocale"],
  urlPatterns: [
    {
      pattern: "/:path(.*)?",
      localized: [
        ["en", "/en/:path(.*)?"],
        ["fr", "/fr/:path(.*)?"],
      ],
    },
  ],
  emitTsDeclarations: true,
})
