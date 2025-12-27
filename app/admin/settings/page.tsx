import Link from "next/link";
import { Home, Truck, Tags, Scale, Info } from "lucide-react";

const settingsLinks = [
  {
    title: "Homepage",
    description: "Hero carousel, featured products, announcement bar",
    href: "/admin/settings/homepage",
    icon: Home,
  },
  {
    title: "About Page",
    description: "Story, values, and studio information",
    href: "/admin/settings/about",
    icon: Info,
  },
  {
    title: "Shipping",
    description: "Shipping zones, rates, and free shipping thresholds",
    href: "/admin/settings/shipping",
    icon: Truck,
  },
  {
    title: "Taxonomies",
    description: "Yarn weight types, product tags, and categories",
    href: "/admin/settings/taxonomies",
    icon: Tags,
  },
  {
    title: "Legal Policies",
    description: "Terms, privacy policy, returns, and shipping policy",
    href: "/admin/settings/legal",
    icon: Scale,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold text-stone-900">
          Settings
        </h1>
        <p className="text-stone-600 mt-1">
          Configure your store settings
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-start gap-4 bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
          >
            <div className="p-3 rounded-lg bg-stone-100">
              <link.icon className="h-6 w-6 text-stone-600" />
            </div>
            <div>
              <h3 className="font-medium text-stone-900">{link.title}</h3>
              <p className="text-sm text-stone-500 mt-1">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
