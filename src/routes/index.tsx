import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const HubApp = lazy(() => import("../game/HubApp"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aurora Hub — 3D Character Rig Builder & Pixel Arcade" },
      {
        name: "description",
        content:
          "A cyber-Roman mission deck with 3D shooters, a Unity-style hand-drawn character rig builder and a pixel-perfect 640x360 render pipeline.",
      },
      { property: "og:title", content: "Aurora Hub — 3D Character Rig Builder" },
      {
        property: "og:description",
        content:
          "Build volumetric hand-drawn character rigs and drop them straight into FPS, TPS and space combat sims.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-white/60 text-xs tracking-[0.3em] uppercase">
      Booting Aurora Core…
    </div>
  );
}

function Index() {
  return (
    <ClientOnly fallback={<Loading />}>
      <Suspense fallback={<Loading />}>
        <HubApp />
      </Suspense>
    </ClientOnly>
  );
}
