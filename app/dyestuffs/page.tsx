import { Metadata } from "next";
import { Leaf, Droplets, Sparkles } from "lucide-react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";

export const metadata: Metadata = {
  title: "Dyestuffs",
  description:
    "Learn about the natural dyestuffs we use to create our beautiful yarn colours.",
};

const plantDyes = [
  {
    name: "Indigo",
    source: "Indigofera tinctoria leaves",
    colors: "True blues, from pale sky to deep navy",
    notes: "The only natural source of true blue. Requires a special fermentation vat process.",
  },
  {
    name: "Weld",
    source: "Reseda luteola - leaves and stems",
    colors: "Clear yellows, from lemon to gold",
    notes: "The most lightfast yellow dye. One of the oldest dyes in Europe.",
  },
  {
    name: "Madder",
    source: "Rubia tinctorum roots",
    colors: "Warm reds, oranges, corals, and terracottas",
    notes: "Takes 3+ years to mature. Different mordants create different shades.",
  },
  {
    name: "Woad",
    source: "Isatis tinctoria leaves",
    colors: "Soft blues and teals",
    notes: "The traditional European blue before indigo. Historically grown in the UK.",
  },
];

const treeDyes = [
  {
    name: "Logwood",
    source: "Haematoxylum campechianum heartwood",
    colors: "Purples, greys, and blacks",
    notes: "Creates beautiful purples alone, or deep blacks with iron modifier.",
  },
  {
    name: "Cutch",
    source: "Acacia catechu heartwood",
    colors: "Rich browns and tans",
    notes: "Excellent lightfastness. Creates warm, earthy tones.",
  },
  {
    name: "Osage Orange",
    source: "Maclura pomifera heartwood",
    colors: "Bright yellows and golds",
    notes: "Very lightfast. Named for the Osage people who used it traditionally.",
  },
];

const otherDyes = [
  {
    name: "Cochineal",
    source: "Dactylopius coccus insects",
    colors: "Vibrant pinks, magentas, and crimsons",
    notes: "The most concentrated natural red. Just a few grams dyes a whole skein.",
  },
  {
    name: "Walnut Hulls",
    source: "Juglans regia outer hulls",
    colors: "Deep browns and rich tans",
    notes: "Locally foraged. A substantive dye requiring no mordant.",
  },
  {
    name: "Pomegranate",
    source: "Punica granatum rinds",
    colors: "Soft yellows and khaki greens",
    notes: "Creates lovely muted tones. Excellent for overdyeing.",
  },
];

export default function DyestuffsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-secondary/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="font-heading text-4xl md:text-5xl font-medium text-foreground mb-6">
                Our Dyestuffs
              </h1>
              <p className="font-body text-lg text-muted-foreground leading-relaxed">
                Every colour in our collection comes from natural sources &mdash; plants,
                trees, and traditional dye materials that have been used for centuries.
              </p>
            </div>
          </div>
        </section>

        {/* Plant Dyes */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Leaf className="h-6 w-6 text-primary" />
              <h2 className="font-heading text-2xl md:text-3xl font-medium text-foreground">
                Plant Dyes
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {plantDyes.map((dye) => (
                <div key={dye.name} className="rounded-lg border p-6">
                  <h3 className="font-heading text-lg font-medium text-foreground mb-1">
                    {dye.name}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground mb-3 italic">
                    {dye.source}
                  </p>
                  <p className="font-body text-sm text-primary mb-2">{dye.colors}</p>
                  <p className="font-body text-sm text-muted-foreground">{dye.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tree Dyes */}
        <section className="bg-secondary/30 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="font-heading text-2xl md:text-3xl font-medium text-foreground">
                Wood & Bark Dyes
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {treeDyes.map((dye) => (
                <div key={dye.name} className="rounded-lg bg-background p-6">
                  <h3 className="font-heading text-lg font-medium text-foreground mb-1">
                    {dye.name}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground mb-3 italic">
                    {dye.source}
                  </p>
                  <p className="font-body text-sm text-primary mb-2">{dye.colors}</p>
                  <p className="font-body text-sm text-muted-foreground">{dye.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Other Dyes */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Droplets className="h-6 w-6 text-primary" />
              <h2 className="font-heading text-2xl md:text-3xl font-medium text-foreground">
                Other Natural Dyes
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {otherDyes.map((dye) => (
                <div key={dye.name} className="rounded-lg border p-6">
                  <h3 className="font-heading text-lg font-medium text-foreground mb-1">
                    {dye.name}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground mb-3 italic">
                    {dye.source}
                  </p>
                  <p className="font-body text-sm text-primary mb-2">{dye.colors}</p>
                  <p className="font-body text-sm text-muted-foreground">{dye.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
