# Color & Form Studio

A generative color and shape tool in the spirit of Johannes Itten, Philipp Otto Runge and Josef Albers. Build tonal grids, checkerboards, band studies, color wheels, concentric rings and color spheres; shuffle palettes by harmony rule; place, move, resize and rotate shapes; export PNG or SVG.

It is a static site with no build step and no dependencies: `index.html`, `styles.css`, `app.js`, `favicon.svg`.

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
npm run dev   # serves on http://localhost:5173
```

## Deploy

Any static host works. Point it at the repo root with no build command.

- **Vercel:** import the repo, framework preset "Other", build command empty, output directory `.`
- **Netlify:** build command empty, publish directory `.`
- **Cloudflare Pages:** framework "None", build command empty, output directory `/`
- **GitHub Pages:** Settings → Pages → Deploy from a branch → `main` / root

## Shortcuts

| Key | Action |
| --- | --- |
| G | Generate |
| V / R / O / T | Select, square, circle, triangle tools |
| Shift + drag | Keep proportions (resize) or snap 15° (rotate) |
| ⌫ | Delete selection |
| ⌘D | Duplicate |
| [ / ] | Send backward / bring forward (Shift for back/front) |
| Arrows | Nudge (Shift for 10px) |
| ⌘Z / ⇧⌘Z | Undo / redo |

## Notes

- Downloads: when the page runs as a claude.ai artifact it saves through the artifact downloads capability; anywhere else it uses a normal browser download.
- Colors are mixed in OKLab. Shapes store palette references, so changing the palette recolors the composition in place.
- Changing composition settings rebuilds the canvas; undo restores manual edits.
