import { formatHours } from "@/lib/hours";
import type { SettingsData } from "@/server/queries/settings";

const linkClass =
  "hover:text-primary rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";

export function Footer({ settings }: { settings: SettingsData }) {
  const { name, address, contacts, schedule, socials } = settings;
  return (
    <footer className="border-border bg-card text-card-foreground border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:grid-cols-3">
        <section>
          <h2 className="mb-2 text-lg font-semibold">{name}</h2>
          {address && <p className="text-muted-foreground">{address}</p>}
          <ul className="mt-2 space-y-1">
            {contacts.phone && (
              <li>
                <a href={`tel:${contacts.phone.replace(/[^\d+]/g, "")}`} className={linkClass}>
                  {contacts.phone}
                </a>
              </li>
            )}
            {contacts.email && (
              <li>
                <a href={`mailto:${contacts.email}`} className={linkClass}>
                  {contacts.email}
                </a>
              </li>
            )}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">Opening hours</h2>
          <table className="text-sm">
            <caption className="sr-only">Opening hours</caption>
            <tbody>
              {schedule.map((day) => (
                <tr key={day.day}>
                  <th scope="row" className="pr-4 text-left font-medium">
                    {day.day}
                  </th>
                  <td className="text-muted-foreground">{formatHours(day)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {socials.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">Follow us</h2>
            <ul className="space-y-1">
              {socials.map(({ label, url }) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </footer>
  );
}
