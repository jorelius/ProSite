import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    slug: z.string().optional(),
    category: z.string(),
    tags: z.array(z.string()),
    description: z.string(),
  }),
});

const pages = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = { posts, pages };
