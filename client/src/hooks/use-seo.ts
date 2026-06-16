import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const SITE_NAME = "Dream Pictures";
const BASE_URL = "https://dream-pictures-2026.fly.dev";
const DEFAULT_OG_IMAGE = `${BASE_URL}/favicon.png`;

export function useSEO({ title, description, canonical, ogImage, noIndex = false }: SEOProps) {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }

    function setLink(rel: string, href: string) {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    }

    const resolvedCanonical = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
    const resolvedOgImage = ogImage || DEFAULT_OG_IMAGE;

    setMeta("description", description);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", description, "property");
    setMeta("og:image", resolvedOgImage, "property");
    setMeta("og:url", resolvedCanonical, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", SITE_NAME, "property");

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", resolvedOgImage);

    setLink("canonical", resolvedCanonical);
  }, [title, description, canonical, ogImage, noIndex]);
}
