import { createFileRoute } from "@tanstack/react-router";

import { Suite } from "@/components/suite";

const title = "Stelsuite: save, send and pay per use on Stellar";
const description = "Ajo savings circles, StellarDrop Telegram transfers and PromptSip pay-per-request AI, settled in USDC on Stellar.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Suite,
});
