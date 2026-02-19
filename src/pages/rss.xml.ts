import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "../consts";

export async function GET(context: any) {
  const posts = (await getCollection("posts", ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: SITE.title,
    description: SITE.subtitle,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/posts/${post.data.slug || post.slug}/`,
    })),
  });
}
