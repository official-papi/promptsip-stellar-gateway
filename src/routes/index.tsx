import { createFileRoute } from "@tanstack/react-router";

import { PromptSipPlayground } from "@/components/promptsip-playground";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PromptSip — Stellar AI Micropayment Playground" },
      { name: "description", content: "Explore pay-per-prompt AI payments with the Stellar HTTP 402 protocol playground." },
      { property: "og:title", content: "PromptSip — Stellar AI Micropayment Playground" },
      { property: "og:description", content: "Explore pay-per-prompt AI payments with the Stellar HTTP 402 protocol playground." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PromptSipPlayground,
});