import { compile } from "@inlang/paraglide-js"

await compile({
  project: "../../packages/localization/project.inlang",
  outdir: "./src/paraglide",
  strategy: ["baseLocale"],
  emitTsDeclarations: true,
})
