import { ethers } from "ethers";

/**
 * Formats a bigint from on-chain decimals to a human-readable string,
 * capped at 2 decimal places.
 */
export function formatUnits(value: bigint, decimals: number): string {
  const full = ethers.formatUnits(value, decimals);
  const num = parseFloat(full);
  return num.toFixed(2);
}

/**
 * Formats an internal Strapi product ID into the public-facing âtv* display name.
 * e.g. "a_fi_USDC" → "âtvUSDC", "a_fi_802" → "âtv802"
 * Falls back to the raw ID if the pattern doesn't match.
 */
export function formatVaultID(vaultID: string): string {
  const match = vaultID.match(/^a_(?:afi|fi)_([A-Za-z0-9]+)(?:_.*)?$/);
  return match ? `âtv${match[1]}` : vaultID;
}
