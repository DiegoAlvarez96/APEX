import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "APEX Personal LooksMax Dashboard",
    short_name: "APEX",
    description: "Rutinas personales, progreso, productos y estadisticas offline.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07080a",
    theme_color: "#07080a",
    categories: ["health", "lifestyle", "productivity"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ],
    screenshots: [
      {
        src: "/screenshots/dashboard.svg",
        sizes: "1170x2532",
        type: "image/svg+xml",
        form_factor: "narrow"
      }
    ]
  };
}
