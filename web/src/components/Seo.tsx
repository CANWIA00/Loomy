import { useEffect } from "react";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(json: string) {
  let el = document.querySelector<HTMLScriptElement>('script[data-seo="jsonld"]');
  if (!el) {
    el = document.createElement("script");
    el.setAttribute("type", "application/ld+json");
    el.setAttribute("data-seo", "jsonld");
    document.head.appendChild(el);
  }
  el.textContent = json;
}

export default function Seo({
  title,
  description,
  canonical,
  image = "https://loomy-app.com/og-image.png",
  jsonLd,
}: {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  jsonLd?: unknown;
}) {
  const jsonLdStr = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", "index, follow, max-image-preview:large");
    upsertLink("canonical", canonical);

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);

    if (jsonLdStr) upsertJsonLd(jsonLdStr);
  }, [title, description, canonical, image, jsonLdStr]);

  return null;
}