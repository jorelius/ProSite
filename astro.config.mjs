import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.jorelfermin.com",
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: "solarized-light",
    },
  },
});
