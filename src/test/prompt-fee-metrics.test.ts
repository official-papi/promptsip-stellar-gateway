import { describe, expect, it } from "vitest";

import { CARD_MINIMUM_USD, getCardMinimumMultiple, STELLAR_PROMPT_FEE_USD } from "@/lib/prompt-fee-metrics";

describe("PromptSip micropayment fee comparison", () => {
  it("uses a $0.00001 Stellar prompt fee against a $0.30 card minimum", () => {
    expect(STELLAR_PROMPT_FEE_USD).toBe(0.00001);
    expect(CARD_MINIMUM_USD).toBe(0.3);
    expect(getCardMinimumMultiple()).toBe(30_000);
  });
});