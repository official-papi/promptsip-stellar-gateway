export const STELLAR_PROMPT_FEE_USD = 0.00001;
export const CARD_MINIMUM_USD = 0.3;

export function getCardMinimumMultiple() {
  return Math.round(CARD_MINIMUM_USD / STELLAR_PROMPT_FEE_USD);
}