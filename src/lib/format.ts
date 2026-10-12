const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// Display only: money stays integer cents everywhere else.
export function formatPrice(cents: number): string {
  return usd.format(cents / 100);
}

function dateTimeIn(timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function formatDateTime(date: Date, timezone: string): string {
  try {
    return dateTimeIn(timezone).format(date);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return dateTimeIn("UTC").format(date);
  }
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/(?!^\+)[^\d]/g, "")}`;
}
