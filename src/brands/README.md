# Brands

**A brand is a folder with one data file: the engine turns a few colours into every token a form page reads, so no brand CSS reaches into components.**

A form opened from an event's site can wear that event's look. The form stores only the brand's key (`Forms.Brand`, picked in the studio under *Görünüm › Tema*); everything else lives here, in code, and ships with a deploy.

## How it works

1. `<key>/brand.js` describes the brand as plain data: a name, two to four colours, optionally fonts and a shape.
2. [`engine.js`](engine.js) validates it and derives the rest: the accent ramp, grey ramp, text, field and button colours, radii and font stacks. The result is a set of CSS custom properties under `[data-brand="<key>"]`, rendered once per page as a `<style>`.
3. [`brands.css`](brands.css) holds the rules every brand shares (see [What every brand gets](#what-every-brand-gets)). They read only those properties, so a brand never writes a selector into a component.
4. [`registry.js`](registry.js) builds every brand when it is first imported. [`BrandScope`](BrandScope.jsx) draws a form page in a brand on the server; [`BrandPaper`](BrandPaper.jsx) draws a studio paper in it. Both mark their root through [`BrandRoot`](BrandRoot.jsx), so a page and a paper carry the same attributes and the same `<style>`.
5. An optional `<key>/slots.jsx` adds decorations at named places, registered in [`slots.js`](slots.js) (see [Decorations](#decorations)).

Pages without a brand never match `[data-brand]`, so SKY LAB's own look is untouched by anything in this folder.

## Add a brand

1. Pick a key: 1 to 32 lowercase letters, digits or dashes. Forms store it, so it must not change once a form uses it. Name the folder after it.
2. Create `src/brands/<key>/brand.js` and put the tab icon under `public/brands/<key>/`.
3. Register the brand in [`registry.js`](registry.js) under that key: one import and one entry.
4. Open a form in the studio and pick the brand under *Görünüm › Tema*. The backend stores the key as is; it needs no change.

A minimal definition, in `src/brands/example/brand.js`:

```js
const example = {
  name: "EXAMPLE",
  site: "https://example.yildizskylab.com",
  icon: "/brands/example/icon.svg",
  colors: { background: "#0b0d12", accent: "#ff8a3d" },
};

export default example;
```

The engine derives everything else from those two colours. [ARTLAB](artlab/brand.js) sets most colours by hand because its page was tuned against its site before the engine existed; a new brand rarely needs to.

> **The build fails on a wrong definition.** `buildBrand` throws `Brand "<key>": …` for an unknown field, a colour it cannot parse, a font that is not in the list or a missing required value. `next build` imports the form page while collecting page data, so the error stops the build before anything ships. In development, the server also logs a warning when a pair of colours reads under WCAG contrast (4.5:1 for text, 3:1 for marks).

## Definition

| Field | Required | Effect |
| --- | --- | --- |
| `name` | yes | Shown in the theme picker and in link previews (`<name> · Skylab Forms`). |
| `colors` | yes | See [Colours](#colours); `background` and `accent` are required. |
| `site` | no | An https address. Decorations can link to it and the picker shows its host. |
| `icon` | no | A path under `public/`, used as the tab icon of the brand's form pages. |
| `shape` | no | `"round"` (default), `"square"` or `"cut"`. `square` and `cut` set Tailwind's radius scale (`rounded-xs` to `rounded-3xl`) to 0; fully round marks such as avatars stay round. `cut` also gives the form card and the submit button cut corners. |
| `fonts` | no | `{ body, display }`, each a family from [`fonts/index.js`](fonts/index.js). `display` sets form and screen titles in that face. |
| `neutrals` | no | 11 colours from 50 to 950 that replace the derived grey ramp. |
| `cardTopSpace` | no | A length such as `"2.5rem"`: room above the form card for a `CardTop` decoration that rises over it. |
| `theme` | no | `"dark"`, the default and for now the only value. The brand's pages stay dark whatever the visitor chose. |

Colours are `#hex` or `oklch(L C H)`. Values never pass through as raw CSS: the engine parses them and writes its own, which is why a definition cannot inject a rule.

## Colours

Forms draws accents soft so a long form stays calm to read. The brand's own colour stays vivid where it marks focus, selection and the background glow; the soft version, kept in the brand's hue, colours everything a respondent touches.

| Colour | Default when left out | Used for |
| --- | --- | --- |
| `background` | required | The page, the browser bar, decoration fills. |
| `accent` | required | Focus rings, text selection, the background glow. |
| `accentSoft` | `oklch(0.85 0.07 <accent hue>)` | Chosen marks, primary buttons, links. The accent ramp steps lighter and darker from it, in its hue. |
| `highlight` | `accent` | The footer mark and decorations. |
| `highlightSoft` | `oklch(0.86 0.085 <highlight hue>)` | Question numbers and the submit button. |
| `text` | A soft white in the background's hue | Body text and white overlays on the page. |
| `heading` | A lighter white in the background's hue | Form and screen titles, selected text. |
| `field` | The background, one step lighter | The ground of inputs. |
| `onAccent` | A deep shade of the accent | Text on `accentSoft`. |
| `onHighlight` | A deep shade of the highlight | Text on the submit button. |

## What every brand gets

[`brands.css`](brands.css) gives every brand the same treatment, coloured by its own properties:

| Part | Rule |
| --- | --- |
| Page | The brand's background; text selection in the accent. |
| Form and screen titles | `heading` on the page. With a `display` font, that face at 700 and the form title at 1.625rem (1.375rem on phones), sized for Unbounded. |
| Question numbers | Outlined in `highlightSoft`. |
| Submit button | Filled with `highlightSoft`, bold `onHighlight` text. |
| Page footer and the SKY LAB Forms mark | `highlight`. |
| Form card, with `shape: "cut"` | Cut corners and a 1 px edge in `heading` at 12%. |

> **These rules have no per-brand switch yet.** They come from ARTLAB, the first brand. When a brand needs a different submit button or title size, give `brand.js` a field for it and branch on it here; changing a rule in place changes ARTLAB too.

## Where a brand shows

| Surface | What it takes |
| --- | --- |
| Form page, its loading card and status screens (`BrandScope`) | Everything: page colours, fonts, shape, accents, decorations. |
| Studio papers: editing, fill preview, map, overview, responses, analytics (`BrandPaper`) | Fonts, shape, accents and the paper's glow. The page colours stay SKY LAB's, because the studio canvas and its panels are not the brand's. |
| Page footer | Only its colour; the footer's layout belongs to SKY LAB Forms. |
| Admin screens, emails, the home page | Nothing. |

## Decorations

Decorations are React components exported by name from `<key>/slots.jsx`, registered in [`slots.js`](slots.js) with one import and one entry. Each export fills the place of the same name:

| Place | Where it renders |
| --- | --- |
| `CardTop` | Inside the form card, first. Position it `absolute` against the card. |
| `StatusTop` | Inside status screens (sent, closed), first, behind the text. |

`slots.js` is **server-only**. `BrandScope` renders the slots on the server, so their code and CSS never reach the browser's JavaScript, and its `import "server-only"` makes an import from a client component fail the build. Slots receive the built brand as `brand` (`brand.siteUrl`, `brand.siteLabel`, `brand.name`). `slots.js` also checks each export of `slots.jsx` against the places above, so a typo such as `Cardtop`, a default export or an exported helper stops the build instead of being ignored.

Style decorations in a `decor.css` imported by `slots.jsx`. It is global CSS, so **prefix every selector with `[data-brand="<key>"]`**; an unprefixed rule reaches every form page, branded or not. Keep the selectors on your own classes: a decoration adds to the page, it does not restyle the card or the fields.

Colour decorations with the brand's properties so they follow `brand.js`. A colour only a decoration uses, such as ARTLAB's guide line (`--al-path`), can stay in its `decor.css`.

| Property | Value |
| --- | --- |
| `--brand-background` | `colors.background` |
| `--brand-accent` | `colors.accent` |
| `--brand-highlight` | `colors.highlight` |
| `--brand-heading` | `colors.heading` |

> **An SVG used as a CSS background cannot read custom properties.** Its colours are baked in, as in ARTLAB's `orbit.svg`. Draw the SVG inline in the slot when it should follow the brand's colours.

## Add a font

1. Put the face in `fonts/` as one woff2 holding Latin and Latin Extended (Turkish needs the latter).
2. Add a `localFont` call and an entry to [`fonts/index.js`](fonts/index.js). next/font only reads calls written at module top level, so each family gets its own constant.

Keep `preload: false`: every page that can show a brand declares all brand faces, and without it every form would download them. Keep the `declarations` family name too, so the face is called what designers call it; the engine writes that name straight into the brand's font stack.
