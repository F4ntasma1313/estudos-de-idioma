import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "English Journey", short_name: "English Journey",
    description: "Estude inglês todos os dias e acompanhe sua evolução.",
    start_url: "/dashboard", scope: "/", display: "standalone",
    background_color: "#f7f8f5", theme_color: "#0c8267",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
