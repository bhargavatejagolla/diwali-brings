<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Typed-array hot loops (particle sims, geometry) rely on noUncheckedIndexedAccess=false; keep it off.
- 3D experience: pure-TS simulations live in src/lib (tested); one R3F Canvas in src/experience mounts only the active scene so unmounted scenes are disposed.
- Keep the experience wrapper and canvas backed by the night theme token and use an opaque WebGL renderer so loading, scene transitions, or context loss cannot expose the host page background.
- Mount only one real WebGL canvas without a disposable probe context; contain errors with an honest retry view, retain the canvas during context restoration, and never substitute 2D scenes.
- Convert CSS night tokens to numeric sRGB before passing them to Three.js, which does not parse OKLCH; use unsigned-byte postprocessing targets to avoid half-float GPU incompatibilities.
- Personalized wish inference uses a public validated POST server function with the AI Gateway SDK; visitors preview/edit the result before release, and inference failures preserve their inputs without automatic replay.
- The camera is shared across scenes: CameraRig snaps to its pose on the first frame after mount and pulls back along the view direction on portrait screens; build transformed geometry once (useMemo/module cache), never inside onUpdate.
- Sky show randomness (shell picking, ambient timing/bounds) lives as pure functions in src/lib/fireworks.ts with tests; SkyScene only schedules and draws them.
- Shared set dressing (marigolds, fairy lights) lives in src/experience/decor.tsx with module-cached geometry; fairy-light points are size-capped so near bulbs never render as big discs.
