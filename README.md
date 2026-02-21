# ProSite

Personal professional site for Jorel Fermin. Built with [Astro](https://astro.build/).

## Development

```sh
npm install
npm run dev
```

Site runs at `http://localhost:4321/`.

## Build

```sh
npm run build
```

Static output goes to `dist/`.

## Deployment

Deployed to GitHub Pages via GitHub Actions on push to `master`. The site is served at `https://www.jorelfermin.com`.

## Project Structure

```
src/
  content/
    posts/       # Blog posts (markdown)
    pages/       # Static pages: about, cv, contacts (markdown)
  components/    # Astro components (sidebar, feed, pagination, etc.)
  layouts/       # Page layouts (base, sidebar, post)
  pages/         # Route definitions
  styles/        # Global CSS
  consts.ts      # Site config, menu, author info, icons
public/
  photo.jpg      # Author photo
  media/         # Post images
  CNAME          # Custom domain config
```
