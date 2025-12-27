import Link from "next/link";
import { ArrowLeft, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import from Shopify</h1>
        <p className="text-muted-foreground">
          Import your products, collections, and customers from Shopify
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-lg bg-muted/20">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mx-auto">
            <Upload className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="font-heading text-xl md:text-2xl mb-4">
            Import Feature Coming Soon
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We&apos;re building a seamless import tool to help you migrate your
            products, collections, and customer data from Shopify.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Manual Import Available</p>
                <p className="text-amber-700">
                  In the meantime, you can add products manually through the{" "}
                  <Link href="/admin/products/new" className="underline hover:no-underline">
                    Products section
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/admin/products/new">
                Add Product Manually
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
