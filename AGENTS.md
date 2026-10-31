<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules

- Keep `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noPropertyAccessFromIndexSignature` off in `tsconfig.json`: the ported game code indexes arrays and option objects pervasively, and re-enabling any of them re-scores dozens of cosmetic errors that mask real ones.
- Keep shared arcade scenery in `src/game/engine/arcadeArtDirection.ts`, decorative and separate from collision/game state; this lets games share visual improvements without changing their rules.
- Define arcade presentation colors in `src/styles.css` and scope controls through the arcade shell; resolve CSS colors through a canvas before passing them to Three.js so OKLCH tokens render correctly.
