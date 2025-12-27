import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Package, MapPin, User, ChevronRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";

const accountLinks = [
  { href: "/account", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

// Check if Clerk is configured
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  clerkPubKey &&
  clerkPubKey.startsWith("pk_") &&
  !clerkPubKey.includes("placeholder");

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only check auth if Clerk is configured
  if (isClerkConfigured) {
    try {
      const { userId } = await auth();
      if (!userId) {
        redirect("/sign-in?redirect_url=/account");
      }
    } catch {
      // Clerk not available, continue without auth
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-stone-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-heading text-3xl text-stone-900 mb-8">
            My Account
          </h1>

          <div className="grid lg:grid-cols-[250px_1fr] gap-8">
            {/* Sidebar Navigation */}
            <aside className="space-y-1">
              <AccountNav />
            </aside>

            {/* Main Content */}
            <div className="bg-white rounded-lg border border-stone-200 p-6 min-h-[400px]">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AccountNav() {
  return (
    <nav className="bg-white rounded-lg border border-stone-200 p-2">
      {accountLinks.map((link) => (
        <AccountNavLink key={link.href} {...link} />
      ))}
    </nav>
  );
}

function AccountNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
        "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 opacity-50" />
    </Link>
  );
}
