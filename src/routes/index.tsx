import { createFileRoute } from "@tanstack/react-router";
import { Experience } from "@/experience/Experience";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "A Thousand Lights, One Wish — Diwali for Dharvi Shravya" },
      { name: "description", content: "A cinematic, interactive Diwali journey: a clay diya, a rangoli of wishes, a lantern garden, a letter and a sky of fireworks." },
      { property: "og:title", content: "A Thousand Lights, One Wish" },
      { property: "og:description", content: "An interactive Diwali journey through light, wishes and fireworks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Experience,
});
