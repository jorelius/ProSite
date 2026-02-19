import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.jorelfermin.com",
  // Remove base when custom domain (www.jorelfermin.com) is configured
  base: "/ProSite",
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: "solarized-light",
    },
  },
});
