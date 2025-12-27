// Comprehensive list of countries with ISO codes and region groupings
// Used for shipping zone configuration

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
}

export interface CountryGroup {
  id: string;
  name: string;
  countries: string[]; // Array of country codes
}

// Full list of countries commonly used for international shipping
export const COUNTRIES: Country[] = [
  // Europe - EU Member States
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },

  // Europe - Non-EU
  { code: "GB", name: "United Kingdom" },
  { code: "NO", name: "Norway" },
  { code: "CH", name: "Switzerland" },
  { code: "IS", name: "Iceland" },
  { code: "LI", name: "Liechtenstein" },

  // North America
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },

  // Oceania
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },

  // Asia
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong SAR" },
  { code: "MY", name: "Malaysia" },
  { code: "TH", name: "Thailand" },
  { code: "TW", name: "Taiwan" },
  { code: "PH", name: "Philippines" },
  { code: "ID", name: "Indonesia" },
  { code: "VN", name: "Vietnam" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },

  // Middle East
  { code: "AE", name: "United Arab Emirates" },
  { code: "IL", name: "Israel" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },

  // South America
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },

  // Africa
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
].sort((a, b) => a.name.localeCompare(b.name));

// EU member states (excludes Ireland which has its own zone)
export const EU_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IT", "LV", "LT", "LU", "MT", "NL", "PL",
  "PT", "RO", "SK", "SI", "ES", "SE"
];

// Country groups for quick selection in admin
export const COUNTRY_GROUPS: CountryGroup[] = [
  {
    id: "uk",
    name: "United Kingdom",
    countries: ["GB"],
  },
  {
    id: "ireland",
    name: "Ireland",
    countries: ["IE"],
  },
  {
    id: "eu",
    name: "European Union",
    countries: EU_COUNTRIES,
  },
  {
    id: "europe_non_eu",
    name: "Europe (Non-EU)",
    countries: ["NO", "CH", "IS", "LI"],
  },
  {
    id: "north_america",
    name: "North America",
    countries: ["US", "CA", "MX"],
  },
  {
    id: "oceania",
    name: "Oceania",
    countries: ["AU", "NZ"],
  },
  {
    id: "asia_pacific",
    name: "Asia Pacific",
    countries: ["JP", "KR", "SG", "HK", "MY", "TH", "TW", "PH", "ID", "VN", "IN", "CN"],
  },
  {
    id: "middle_east",
    name: "Middle East",
    countries: ["AE", "IL", "SA", "QA", "KW", "BH", "OM"],
  },
  {
    id: "south_america",
    name: "South America",
    countries: ["BR", "AR", "CL", "CO", "PE"],
  },
  {
    id: "africa",
    name: "Africa",
    countries: ["ZA", "NG", "KE", "EG", "MA"],
  },
];

// Helper to get country name by code
export function getCountryName(code: string): string {
  return COUNTRIES.find(c => c.code === code)?.name || code;
}

// Helper to get multiple country names
export function getCountryNames(codes: string[]): string[] {
  return codes.map(code => getCountryName(code));
}

// Helper to check if a code is valid
export function isValidCountryCode(code: string): boolean {
  return COUNTRIES.some(c => c.code === code);
}

// Default Shopify-matching shipping configuration
export const SHOPIFY_SHIPPING_CONFIG = {
  zones: [
    {
      name: "United Kingdom",
      countries: ["GB"],
      rates: [
        { name: "Evri", minWeightGrams: 0, maxWeightGrams: 2000, price: 3.80, estimatedDays: "2-4", tracked: false },
        { name: "Royal Mail 48", minWeightGrams: 0, maxWeightGrams: 2000, price: 4.00, estimatedDays: "2-4", tracked: false },
        { name: "Royal Mail 48", minWeightGrams: 2001, maxWeightGrams: 5000, price: 8.25, estimatedDays: "2-4", tracked: false },
      ],
    },
    {
      name: "Ireland",
      countries: ["IE"],
      rates: [
        { name: "Large letter", minWeightGrams: 0, maxWeightGrams: 499, price: 3.25, estimatedDays: "3-5", tracked: false },
        { name: "Royal Mail - no tracking", minWeightGrams: 0, maxWeightGrams: 500, price: 8.25, estimatedDays: "3-7", tracked: false },
        { name: "Royal Mail with tracking", minWeightGrams: 0, maxWeightGrams: 500, price: 11.25, estimatedDays: "3-7", tracked: true },
        { name: "Royal Mail with tracking", minWeightGrams: 511, maxWeightGrams: 1000, price: 15.00, estimatedDays: "3-7", tracked: true },
      ],
    },
    {
      name: "EU (European Union)",
      countries: EU_COUNTRIES,
      rates: [
        { name: "Standard International", minWeightGrams: 0, maxWeightGrams: 500, price: 11.25, estimatedDays: "2-11", tracked: false },
        { name: "Standard International", minWeightGrams: 510, maxWeightGrams: 1000, price: 15.00, estimatedDays: "2-11", tracked: false },
      ],
    },
    {
      name: "International",
      countries: ["AE", "AU", "CA", "HK", "IL", "JP", "MY", "NZ", "NO", "SG", "KR", "CH", "US"],
      rates: [
        { name: "Standard International Tracked", minWeightGrams: 0, maxWeightGrams: 500, price: 22.00, estimatedDays: "7-21", tracked: true },
        { name: "Standard International Tracked", minWeightGrams: 510, maxWeightGrams: 1000, price: 28.00, estimatedDays: "7-21", tracked: true },
      ],
    },
  ],
  freeShippingEnabled: false,
  freeShippingThreshold: 50,
};
