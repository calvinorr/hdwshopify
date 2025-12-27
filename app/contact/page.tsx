import { Metadata } from "next";
import { Mail, MapPin, Clock } from "lucide-react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Herbarium Dyeworks. We'd love to hear from you about our naturally dyed yarns.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-heading text-3xl md:text-4xl font-medium text-foreground mb-4">
              Contact Us
            </h1>
            <p className="font-body text-muted-foreground mb-12 max-w-2xl">
              Have a question about our yarns, need help with an order, or just want
              to say hello? We&apos;d love to hear from you.
            </p>

            <div className="grid gap-12 lg:grid-cols-2">
              {/* Contact Form */}
              <div>
                <h2 className="font-heading text-xl font-medium text-foreground mb-6">
                  Send us a message
                </h2>
                <form className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="your@email.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="What is this about?" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us what's on your mind..."
                      rows={6}
                    />
                  </div>
                  <Button type="submit" className="w-full sm:w-auto">
                    Send Message
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <h2 className="font-heading text-xl font-medium text-foreground mb-6">
                  Get in touch
                </h2>

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-medium text-foreground">Email</h3>
                    <p className="font-body text-muted-foreground">
                      hello@herbariumdyeworks.com
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-medium text-foreground">Location</h3>
                    <p className="font-body text-muted-foreground">
                      Northern Ireland, UK
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-medium text-foreground">Response Time</h3>
                    <p className="font-body text-muted-foreground">
                      We aim to respond within 1-2 business days
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/50 p-6 mt-8">
                  <h3 className="font-heading font-medium text-foreground mb-2">
                    Wholesale Enquiries
                  </h3>
                  <p className="font-body text-sm text-muted-foreground">
                    Interested in stocking our yarns? Please include &quot;Wholesale&quot;
                    in your subject line and tell us about your shop.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
