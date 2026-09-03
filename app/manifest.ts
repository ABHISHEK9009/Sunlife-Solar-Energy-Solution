import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sunlife Solar Energy Solution",
    short_name: "Sunlife Solar",
    description: "Rooftop solar installation and clean energy solutions in Narmadapuram and Madhya Pradesh.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0B4D3C",
    icons: [{ src: "/logo/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
