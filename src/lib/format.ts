const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// Display only: money stays integer cents everywhere else.
export function formatPrice(cents: number): string {
  return usd.format(cents / 100);
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;
}
