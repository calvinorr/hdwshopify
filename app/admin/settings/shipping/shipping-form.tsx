"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Truck,
  Package,
  Globe,
  Check,
  Users,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES, COUNTRY_GROUPS, getCountryName, SHOPIFY_SHIPPING_CONFIG } from "@/lib/data/countries";

interface ShippingRate {
  id?: number;
  name: string;
  minWeightGrams: number | null;
  maxWeightGrams: number | null;
  price: number;
  estimatedDays: string | null;
  tracked: boolean | null;
}

interface ShippingZone {
  id?: number;
  name: string;
  countries: string; // JSON array of country codes
  rates: ShippingRate[];
}

interface Props {
  zones: ShippingZone[];
  freeShippingThreshold: string;
  freeShippingEnabled: boolean;
}

export function ShippingSettingsForm({
  zones: initialZones,
  freeShippingThreshold: initialThreshold,
  freeShippingEnabled: initialEnabled,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Free shipping settings
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(initialEnabled);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(initialThreshold);

  // Zones
  const [zones, setZones] = useState<ShippingZone[]>(
    initialZones.length > 0
      ? initialZones.map((z) => ({
          ...z,
          rates: z.rates.map((r) => ({
            ...r,
            minWeightGrams: r.minWeightGrams ?? 0,
          })),
        }))
      : []
  );

  // Expanded zones
  const [expandedZones, setExpandedZones] = useState<number[]>([0]);

  // Toggle zone expansion
  const toggleZone = (index: number) => {
    setExpandedZones((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  // Add new zone
  const addZone = () => {
    const newIndex = zones.length;
    setZones([
      ...zones,
      {
        name: "New Zone",
        countries: "[]",
        rates: [
          {
            name: "Standard Shipping",
            minWeightGrams: 0,
            maxWeightGrams: null,
            price: 5.0,
            estimatedDays: "3-5",
            tracked: false,
          },
        ],
      },
    ]);
    setExpandedZones([...expandedZones, newIndex]);
  };

  // Remove zone
  const removeZone = (index: number) => {
    setZones(zones.filter((_, i) => i !== index));
    setExpandedZones(expandedZones.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
  };

  // Update zone field
  const updateZone = (index: number, field: keyof ShippingZone, value: any) => {
    const updated = [...zones];
    updated[index] = { ...updated[index], [field]: value };
    setZones(updated);
  };

  // Toggle country in zone
  const toggleCountry = (zoneIndex: number, countryCode: string) => {
    const zone = zones[zoneIndex];
    const countries = JSON.parse(zone.countries || "[]") as string[];
    const updated = countries.includes(countryCode)
      ? countries.filter((c) => c !== countryCode)
      : [...countries, countryCode];
    updateZone(zoneIndex, "countries", JSON.stringify(updated));
  };

  // Get formatted country names from codes
  const getCountryNamesDisplay = (countriesJson: string) => {
    const codes = JSON.parse(countriesJson || "[]") as string[];
    if (codes.length === 0) return "";
    if (codes.length <= 3) {
      return codes.map((code) => getCountryName(code)).join(", ");
    }
    return `${codes.slice(0, 2).map((code) => getCountryName(code)).join(", ")} +${codes.length - 2} more`;
  };

  // Add all countries from a group to a zone
  const addCountryGroup = (zoneIndex: number, groupId: string) => {
    const group = COUNTRY_GROUPS.find((g) => g.id === groupId);
    if (!group) return;

    const zone = zones[zoneIndex];
    const currentCountries = JSON.parse(zone.countries || "[]") as string[];
    const newCountries = [...new Set([...currentCountries, ...group.countries])];
    updateZone(zoneIndex, "countries", JSON.stringify(newCountries));
  };

  // Remove all countries from a group from a zone
  const removeCountryGroup = (zoneIndex: number, groupId: string) => {
    const group = COUNTRY_GROUPS.find((g) => g.id === groupId);
    if (!group) return;

    const zone = zones[zoneIndex];
    const currentCountries = JSON.parse(zone.countries || "[]") as string[];
    const newCountries = currentCountries.filter((c) => !group.countries.includes(c));
    updateZone(zoneIndex, "countries", JSON.stringify(newCountries));
  };

  // Check if all countries in a group are selected
  const isGroupFullySelected = (zoneIndex: number, groupId: string) => {
    const group = COUNTRY_GROUPS.find((g) => g.id === groupId);
    if (!group) return false;

    const zone = zones[zoneIndex];
    const currentCountries = JSON.parse(zone.countries || "[]") as string[];
    return group.countries.every((c) => currentCountries.includes(c));
  };

  // Check if some countries in a group are selected
  const isGroupPartiallySelected = (zoneIndex: number, groupId: string) => {
    const group = COUNTRY_GROUPS.find((g) => g.id === groupId);
    if (!group) return false;

    const zone = zones[zoneIndex];
    const currentCountries = JSON.parse(zone.countries || "[]") as string[];
    const selectedCount = group.countries.filter((c) => currentCountries.includes(c)).length;
    return selectedCount > 0 && selectedCount < group.countries.length;
  };

  // Add rate to zone
  const addRate = (zoneIndex: number) => {
    const zone = zones[zoneIndex];
    const lastRate = zone.rates[zone.rates.length - 1];
    const newMinWeight = lastRate ? (lastRate.maxWeightGrams || 0) : 0;

    const updated = [...zones];
    updated[zoneIndex] = {
      ...zone,
      rates: [
        ...zone.rates,
        {
          name: "Shipping Rate",
          minWeightGrams: newMinWeight,
          maxWeightGrams: null,
          price: lastRate ? lastRate.price + 2 : 5.0,
          estimatedDays: lastRate?.estimatedDays || "3-5",
          tracked: false,
        },
      ],
    };
    setZones(updated);
  };

  // Remove rate from zone
  const removeRate = (zoneIndex: number, rateIndex: number) => {
    const zone = zones[zoneIndex];
    const updated = [...zones];
    updated[zoneIndex] = {
      ...zone,
      rates: zone.rates.filter((_, i) => i !== rateIndex),
    };
    setZones(updated);
  };

  // Update rate field
  const updateRate = (
    zoneIndex: number,
    rateIndex: number,
    field: keyof ShippingRate,
    value: any
  ) => {
    const updated = [...zones];
    const zone = updated[zoneIndex];
    zone.rates[rateIndex] = { ...zone.rates[rateIndex], [field]: value };
    setZones(updated);
  };

  // Import Shopify configuration
  const importShopifyConfig = () => {
    if (zones.length > 0 && !confirm("This will replace all existing zones with the Shopify configuration. Continue?")) {
      return;
    }

    const shopifyZones: ShippingZone[] = SHOPIFY_SHIPPING_CONFIG.zones.map((zone) => ({
      name: zone.name,
      countries: JSON.stringify(zone.countries),
      rates: zone.rates.map((rate) => ({
        name: rate.name,
        minWeightGrams: rate.minWeightGrams,
        maxWeightGrams: rate.maxWeightGrams,
        price: rate.price,
        estimatedDays: rate.estimatedDays,
        tracked: rate.tracked,
      })),
    }));

    setZones(shopifyZones);
    setFreeShippingEnabled(SHOPIFY_SHIPPING_CONFIG.freeShippingEnabled);
    setFreeShippingThreshold(String(SHOPIFY_SHIPPING_CONFIG.freeShippingThreshold));
    setExpandedZones([0]); // Expand first zone
  };

  // Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/settings/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeShippingEnabled,
          freeShippingThreshold: parseFloat(freeShippingThreshold) || 50,
          zones,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/settings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-semibold text-stone-900">
              Shipping Settings
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Configure shipping zones and rates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={importShopifyConfig}>
            <Download className="h-4 w-4 mr-2" />
            Import Shopify Config
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Settings saved successfully!
        </div>
      )}

      {/* Free Shipping */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Truck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-medium text-stone-900">Free Shipping</h2>
              <p className="text-sm text-stone-500">
                Offer free shipping on orders over a threshold
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={freeShippingEnabled}
              onChange={(e) => setFreeShippingEnabled(e.target.checked)}
              className="rounded border-stone-300"
            />
            <span className="text-sm text-stone-600">Enabled</span>
          </label>
        </div>

        {freeShippingEnabled && (
          <div className="space-y-2">
            <Label htmlFor="threshold">Minimum Order Value (GBP)</Label>
            <div className="flex items-center gap-2">
              <span className="text-stone-500">£</span>
              <Input
                id="threshold"
                type="number"
                step="0.01"
                min="0"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="max-w-32"
              />
            </div>
            <p className="text-xs text-stone-500">
              Orders over this amount qualify for free shipping (UK only)
            </p>
          </div>
        )}
      </div>

      {/* Shipping Zones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-medium text-stone-900">Shipping Zones</h2>
              <p className="text-sm text-stone-500">
                Define regions and their shipping rates
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addZone}>
            <Plus className="h-4 w-4 mr-1" />
            Add Zone
          </Button>
        </div>

        {zones.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Package className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600 mb-4">No shipping zones configured</p>
            <Button type="button" variant="outline" onClick={addZone}>
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Zone
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {zones.map((zone, zoneIndex) => {
              const isExpanded = expandedZones.includes(zoneIndex);
              const countryCodes = JSON.parse(zone.countries || "[]") as string[];

              return (
                <div
                  key={zoneIndex}
                  className="bg-white rounded-lg border overflow-hidden"
                >
                  {/* Zone header */}
                  <button
                    type="button"
                    onClick={() => toggleZone(zoneIndex)}
                    className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-stone-400" />
                      <div className="text-left">
                        <h3 className="font-medium text-stone-900">
                          {zone.name}
                        </h3>
                        <p className="text-sm text-stone-500">
                          {countryCodes.length === 0
                            ? "No countries selected"
                            : `${countryCodes.length} ${
                                countryCodes.length === 1
                                  ? "country"
                                  : "countries"
                              }`}
                          {" • "}
                          {zone.rates.length}{" "}
                          {zone.rates.length === 1 ? "rate" : "rates"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeZone(zoneIndex);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-stone-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {/* Zone content */}
                  {isExpanded && (
                    <div className="border-t p-4 space-y-6">
                      {/* Zone name */}
                      <div className="space-y-2">
                        <Label>Zone Name</Label>
                        <Input
                          value={zone.name}
                          onChange={(e) =>
                            updateZone(zoneIndex, "name", e.target.value)
                          }
                          placeholder="e.g., United Kingdom, Europe"
                        />
                      </div>

                      {/* Countries */}
                      <div className="space-y-3">
                        <Label>Countries</Label>
                        <p className="text-xs text-stone-500">
                          Select which countries this zone applies to
                        </p>

                        {/* Quick group selection */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <Users className="h-3 w-3" />
                            <span>Quick select by region:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {COUNTRY_GROUPS.map((group) => {
                              const isFullySelected = isGroupFullySelected(zoneIndex, group.id);
                              const isPartiallySelected = isGroupPartiallySelected(zoneIndex, group.id);
                              return (
                                <button
                                  key={group.id}
                                  type="button"
                                  onClick={() =>
                                    isFullySelected
                                      ? removeCountryGroup(zoneIndex, group.id)
                                      : addCountryGroup(zoneIndex, group.id)
                                  }
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    isFullySelected
                                      ? "bg-primary text-white"
                                      : isPartiallySelected
                                      ? "bg-primary/20 text-primary border border-primary/30"
                                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                  }`}
                                >
                                  {group.name}
                                  {isFullySelected && (
                                    <span className="ml-1">({group.countries.length})</span>
                                  )}
                                  {isPartiallySelected && !isFullySelected && (
                                    <span className="ml-1">
                                      ({countryCodes.filter((c) => group.countries.includes(c)).length}/{group.countries.length})
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Individual country selection */}
                        <div className="border rounded-lg">
                          <div className="p-2 border-b bg-stone-50 flex items-center justify-between">
                            <span className="text-xs text-stone-500">
                              {countryCodes.length} countries selected
                            </span>
                            {countryCodes.length > 0 && (
                              <button
                                type="button"
                                onClick={() => updateZone(zoneIndex, "countries", "[]")}
                                className="text-xs text-red-500 hover:text-red-600"
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 max-h-48 overflow-y-auto p-2">
                            {COUNTRIES.map((country) => {
                              const isSelected = countryCodes.includes(country.code);
                              return (
                                <button
                                  key={country.code}
                                  type="button"
                                  onClick={() => toggleCountry(zoneIndex, country.code)}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors ${
                                    isSelected
                                      ? "bg-primary/10 text-primary"
                                      : "hover:bg-stone-100"
                                  }`}
                                >
                                  <div
                                    className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                      isSelected
                                        ? "bg-primary border-primary"
                                        : "border-stone-300"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  <span className="truncate text-xs">{country.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Rates */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Shipping Rates</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addRate(zoneIndex)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Rate
                          </Button>
                        </div>

                        {zone.rates.length === 0 ? (
                          <div className="border rounded-lg p-4 text-center text-stone-500 text-sm">
                            No rates configured
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {zone.rates.map((rate, rateIndex) => (
                              <div
                                key={rateIndex}
                                className="border rounded-lg p-4 space-y-4"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {/* Rate name */}
                                    <div className="space-y-1">
                                      <Label className="text-xs">
                                        Rate Name
                                      </Label>
                                      <Input
                                        value={rate.name}
                                        onChange={(e) =>
                                          updateRate(
                                            zoneIndex,
                                            rateIndex,
                                            "name",
                                            e.target.value
                                          )
                                        }
                                        placeholder="e.g., Royal Mail"
                                        className="text-sm"
                                      />
                                    </div>

                                    {/* Weight range */}
                                    <div className="space-y-1">
                                      <Label className="text-xs">
                                        Weight Range (g)
                                      </Label>
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          min="0"
                                          value={rate.minWeightGrams ?? 0}
                                          onChange={(e) =>
                                            updateRate(
                                              zoneIndex,
                                              rateIndex,
                                              "minWeightGrams",
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                          className="text-sm"
                                          placeholder="0"
                                        />
                                        <span className="text-stone-400">-</span>
                                        <Input
                                          type="number"
                                          min="0"
                                          value={rate.maxWeightGrams || ""}
                                          onChange={(e) =>
                                            updateRate(
                                              zoneIndex,
                                              rateIndex,
                                              "maxWeightGrams",
                                              e.target.value
                                                ? parseInt(e.target.value)
                                                : null
                                            )
                                          }
                                          className="text-sm"
                                          placeholder="No limit"
                                        />
                                      </div>
                                    </div>

                                    {/* Price */}
                                    <div className="space-y-1">
                                      <Label className="text-xs">
                                        Price (GBP)
                                      </Label>
                                      <div className="flex items-center gap-1">
                                        <span className="text-stone-500 text-sm">
                                          £
                                        </span>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={rate.price}
                                          onChange={(e) =>
                                            updateRate(
                                              zoneIndex,
                                              rateIndex,
                                              "price",
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          className="text-sm"
                                        />
                                      </div>
                                    </div>

                                    {/* Estimated days */}
                                    <div className="space-y-1">
                                      <Label className="text-xs">
                                        Est. Days
                                      </Label>
                                      <Input
                                        value={rate.estimatedDays || ""}
                                        onChange={(e) =>
                                          updateRate(
                                            zoneIndex,
                                            rateIndex,
                                            "estimatedDays",
                                            e.target.value || null
                                          )
                                        }
                                        placeholder="e.g., 2-4"
                                        className="text-sm"
                                      />
                                    </div>
                                  </div>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 flex-shrink-0"
                                    onClick={() =>
                                      removeRate(zoneIndex, rateIndex)
                                    }
                                    disabled={zone.rates.length === 1}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Tracked checkbox */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={rate.tracked ?? false}
                                    onChange={(e) =>
                                      updateRate(
                                        zoneIndex,
                                        rateIndex,
                                        "tracked",
                                        e.target.checked
                                      )
                                    }
                                    className="rounded border-stone-300"
                                  />
                                  <span className="text-sm text-stone-600">
                                    Tracked shipping
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info about shipping */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-900 mb-2">Shipping Notes</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>
            • <strong>Weight-based pricing:</strong> Rates are calculated based on total order weight in grams
          </li>
          <li>
            • <strong>Windsor Framework:</strong> Northern Ireland businesses can ship to EU without customs duties
          </li>
          <li>
            • <strong>DDP (Delivered Duty Paid):</strong> Seller pays all duties/taxes - customer pays nothing extra
          </li>
          <li>
            • <strong>DDU (Delivered Duty Unpaid):</strong> Customer may need to pay local import duties
          </li>
          <li>
            • <strong>Free shipping:</strong> When enabled, applies to UK orders over the threshold
          </li>
        </ul>
      </div>
    </form>
  );
}
