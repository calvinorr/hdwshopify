import { Metadata } from "next";
import { Leaf, Droplets, Sun, Palette } from "lucide-react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";

export const metadata: Metadata = {
  title: "Natural Dyes",
  description:
    "Learn about our natural dyeing process and the botanical extracts we use to create beautiful, sustainable yarn colours.",
};

const dyeSources = [
  {
    name: "Indigo",
    colors: "Blues",
    description:
      "One of the oldest dyes known to humanity, indigo creates deep, rich blues through a fascinating fermentation process.",
  },
  {
    name: "Madder Root",
    colors: "Reds, Oranges, Corals",
    description:
      "The roots of the madder plant produce warm reds and oranges that have been prized for thousands of years.",
  },
  {
    name: "Weld",
    colors: "Yellows, Golds",
    description:
      "This ancient dye plant produces the most lightfast yellow of all natural dyes, from soft butter to rich gold.",
  },
  {
    name: "Logwood",
    colors: "Purples, Greys, Blacks",
    description:
      "From the heartwood of a Central American tree, logwood creates beautiful purples and, with iron, deep blacks.",
  },
  {
    name: "Walnut Hulls",
    colors: "Browns, Tans",
    description:
      "Locally foraged walnut hulls give us rich, warm browns with excellent lightfastness.",
  },
  {
    name: "Cochineal",
    colors: "Pinks, Magentas, Crimsons",
    description:
      "This traditional dye produces the most vibrant pinks and reds in the natural dyer's palette.",
  },
];

export default function NaturalDyesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-secondary/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="font-heading text-4xl md:text-5xl font-medium text-foreground mb-6">
                Natural Dyes
              </h1>
              <p className="font-body text-lg text-muted-foreground leading-relaxed">
                Every colour in our collection comes from plants, roots, bark, and
                other natural sources. We believe in the beauty and sustainability
                of traditional dyeing methods.
              </p>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-2xl md:text-3xl font-medium text-foreground mb-12 text-center">
              Our Dyeing Process
            </h2>
            <div className="grid gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Droplets className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                  Scouring
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  We gently clean the yarn to remove natural oils and prepare
                  the fibres for dyeing.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Leaf className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                  Mordanting
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  Natural mordants help the dye bond permanently with the
                  fibres for lasting colour.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Palette className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                  Dyeing
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  The yarn is slowly dyed in botanical extracts, sometimes
                  over multiple days.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Sun className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                  Curing
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  Finally, the yarn is rinsed and dried, allowing the colours
                  to fully develop.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dye Sources */}
        <section className="bg-secondary/30 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-2xl md:text-3xl font-medium text-foreground mb-12 text-center">
              Our Dye Sources
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {dyeSources.map((dye) => (
                <div key={dye.name} className="rounded-lg bg-background p-6">
                  <h3 className="font-heading text-lg font-medium text-foreground mb-1">
                    {dye.name}
                  </h3>
                  <p className="font-body text-sm text-primary mb-3">{dye.colors}</p>
                  <p className="font-body text-sm text-muted-foreground">
                    {dye.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Care Note */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-heading text-2xl font-medium text-foreground mb-4">
                Caring for Naturally Dyed Yarn
              </h2>
              <p className="font-body text-muted-foreground">
                Natural dyes are generally lightfast and washfast when properly applied.
                We recommend hand washing in cool water with a gentle wool wash, and
                drying flat away from direct sunlight to preserve the beauty of your
                yarn for years to come.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
