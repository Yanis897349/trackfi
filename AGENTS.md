# Trackfi engineering conventions

- Use pnpm through mise. Do not introduce npm, Yarn, or Bun lockfiles.
- Before creating a UI primitive or pattern, check the current shadcn/ui components and blocks. Add or adapt the existing shadcn implementation when one exists.
- Keep reusable UI in `@trackfi/ui`; keep product-specific compositions in the consuming app.
- Before adding a reusable helper or pattern, search the relevant workspace packages for an existing implementation. Reuse or extend shared behavior when the semantics match.
- Keep shared code within its appropriate runtime and package boundary; do not introduce cross-layer coupling solely to remove duplication.
- When a file mixes multiple responsibilities or becomes difficult to review, split it into focused modules or components.
- Import animations from `motion/react`. Use the shared `spring.fast`, `spring.moderate`, or `spring.slow` tokens from `@trackfi/ui/lib/springs`; do not invent per-component motion timings.
- Respect the user's reduced-motion preference. Prefer CSS transitions for simple color-only state changes and Motion for layout, presence, or gesture animation.
- Keep Cloudflare Worker code Web Platform-native unless a dependency requires a compatibility flag.
