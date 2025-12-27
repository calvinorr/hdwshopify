import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Common questions about Herbarium Dyeworks naturally dyed yarns.",
};

const faqs = [
  {
    category: "Products",
    questions: [
      {
        q: "Are natural dyes colourfast?",
        a: "Yes! When properly applied with appropriate mordants, natural dyes are highly colourfast. We recommend hand washing in cool water and drying away from direct sunlight to maintain the vibrancy of your yarn.",
      },
      {
        q: "Will the colours vary between skeins?",
        a: "Slight variations are part of the beauty of hand-dyed yarn. We do our best to ensure consistency within dye lots, but natural dyes can produce subtle variations. We recommend purchasing all the yarn you need for a project from the same dye lot.",
      },
      {
        q: "What fibre bases do you use?",
        a: "We work with a variety of high-quality bases including BFL (Blue Faced Leicester), Merino, Alpaca Silk blends, and more. Each product listing specifies the fibre content.",
      },
      {
        q: "How should I care for naturally dyed yarn?",
        a: "Hand wash in cool water with a gentle wool wash. Do not soak for extended periods. Roll in a towel to remove excess water and dry flat away from direct sunlight and heat.",
      },
    ],
  },
  {
    category: "Orders & Shipping",
    questions: [
      {
        q: "How long does shipping take?",
        a: "UK orders typically arrive within 2-3 business days. International shipping varies by destination - see our Shipping page for detailed estimates.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes! We ship worldwide. Shipping costs and delivery times vary by destination. For European orders, there are no import duties thanks to the Windsor Framework.",
      },
      {
        q: "Can I track my order?",
        a: "Yes, once your order ships, you'll receive an email with tracking information. Orders over a certain weight are sent with tracked shipping.",
      },
      {
        q: "What if my order arrives damaged?",
        a: "Please contact us within 7 days of delivery with photos of any damage. We'll arrange a replacement or refund including return shipping costs.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    questions: [
      {
        q: "Can I return my order?",
        a: "We accept returns of unused yarn in original condition within 14 days of delivery. See our Returns page for full details.",
      },
      {
        q: "What items cannot be returned?",
        a: "Custom orders, sale items (unless faulty), yarn that has been wound or used, and gift cards cannot be returned.",
      },
      {
        q: "How long do refunds take?",
        a: "Once we receive your return, refunds are processed within 5-7 business days to your original payment method.",
      },
    ],
  },
  {
    category: "Wholesale & Custom Orders",
    questions: [
      {
        q: "Do you offer wholesale pricing?",
        a: "Yes! We work with yarn shops and retailers. Please contact us with 'Wholesale' in the subject line to discuss terms and minimums.",
      },
      {
        q: "Can I request a custom dye colour?",
        a: "We occasionally accept custom dye commissions depending on our schedule. Contact us to discuss your project - minimum quantities apply.",
      },
      {
        q: "Do you offer discounts for large orders?",
        a: "For bulk orders or special projects, please get in touch and we'll see what we can arrange.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-heading text-3xl md:text-4xl font-medium text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="font-body text-muted-foreground mb-12">
              Find answers to common questions about our yarns, ordering, and more.
            </p>

            <div className="space-y-10">
              {faqs.map((section) => (
                <div key={section.category}>
                  <h2 className="font-heading text-xl font-medium text-foreground mb-4">
                    {section.category}
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {section.questions.map((faq, index) => (
                      <AccordionItem key={index} value={`${section.category}-${index}`}>
                        <AccordionTrigger className="font-body text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="font-body text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>

            {/* Still have questions */}
            <div className="mt-12 rounded-lg bg-secondary/50 p-6 text-center">
              <h2 className="font-heading text-lg font-medium text-foreground mb-2">
                Still have questions?
              </h2>
              <p className="font-body text-sm text-muted-foreground mb-4">
                We&apos;re here to help! Get in touch and we&apos;ll get back to you
                as soon as we can.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
