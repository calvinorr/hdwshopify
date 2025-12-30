"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentValue = "all" | "essential" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue | "loading">("loading");

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    setConsent(stored as ConsentValue);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "all");
    setConsent("all");
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "essential");
    setConsent("essential");
  };

  // Don't render anything while loading or if consent already given
  if (consent === "loading" || consent !== null) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900 text-stone-100 p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm">
          <p>
            We use cookies to enhance your experience. Essential cookies are
            required for the site to function. Analytics cookies help us improve
            our site.{" "}
            <Link href="/privacy" className="underline hover:text-stone-300">
              Learn more
            </Link>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEssentialOnly}
            className="bg-transparent border-stone-400 text-stone-100 hover:bg-stone-800 hover:text-stone-100"
          >
            Essential Only
          </Button>
          <Button
            size="sm"
            onClick={handleAcceptAll}
            className="bg-stone-100 text-stone-900 hover:bg-stone-200"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if user has consented to non-essential cookies
 * Use this before loading analytics, marketing pixels, etc.
 */
export function useHasAnalyticsConsent(): boolean {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    setHasConsent(consent === "all");
  }, []);

  return hasConsent;
}
