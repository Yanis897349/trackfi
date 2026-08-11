# Trackfi engineering conventions

- Use pnpm through mise. Do not introduce npm, Yarn, or Bun lockfiles.
- Before creating a UI primitive or pattern, check the current shadcn/ui components and blocks. Add or adapt the existing shadcn implementation when one exists.
- Keep reusable UI in `@trackfi/ui`; keep product-specific compositions in the consuming app.
- Import animations from `motion/react`. Use the shared `spring.fast`, `spring.moderate`, or `spring.slow` tokens from `@trackfi/ui/lib/springs`; do not invent per-component motion timings.
- Respect the user's reduced-motion preference. Prefer CSS transitions for simple color-only state changes and Motion for layout, presence, or gesture animation.
- Keep Cloudflare Worker code Web Platform-native unless a dependency requires a compatibility flag.
