"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2,
  XCircle,
  RefreshCw,
  Trash2,
  Package,
  FolderOpen,
  Image as ImageIcon,
  Users,
  MapPin,
  ShoppingCart,
  FileText,
  ClipboardCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CredentialsStatus {
  configured: boolean;
  domain?: string;
}

interface ProductMigrationResult {
  success: boolean;
  message: string;
  productsImported?: number;
  variantsImported?: number;
  imagesImported?: number;
  collectionsImported?: number;
  errors?: string[];
  error?: string;
}

interface CustomerMigrationResult {
  success: boolean;
  message: string;
  customersImported?: number;
  customersSkipped?: number;
  addressesImported?: number;
  errors?: string[];
  error?: string;
}

interface OrderMigrationResult {
  success: boolean;
  message: string;
  ordersImported?: number;
  ordersSkipped?: number;
  orderItemsImported?: number;
  errors?: string[];
  error?: string;
}

interface ValidationCheck {
  category: string;
  check: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: unknown;
}

interface ValidationResult {
  success: boolean;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
    status: "passed" | "warning" | "failed";
  };
  counts: Record<string, number>;
  checks: ValidationCheck[];
  validatedAt: string;
}

export default function ImportPage() {
  const [credentialsStatus, setCredentialsStatus] = useState<CredentialsStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Product import state
  const [isImportingProducts, setIsImportingProducts] = useState(false);
  const [isClearingProducts, setIsClearingProducts] = useState(false);
  const [productResult, setProductResult] = useState<ProductMigrationResult | null>(null);
  const [productLimit, setProductLimit] = useState<number>(20);
  const [activeOnly, setActiveOnly] = useState(true);
  const [clearExistingProducts, setClearExistingProducts] = useState(false);

  // Customer import state
  const [isImportingCustomers, setIsImportingCustomers] = useState(false);
  const [isClearingCustomers, setIsClearingCustomers] = useState(false);
  const [customerResult, setCustomerResult] = useState<CustomerMigrationResult | null>(null);
  const [customerLimit, setCustomerLimit] = useState<number>(100);

  // Order import state
  const [isImportingOrders, setIsImportingOrders] = useState(false);
  const [isClearingOrders, setIsClearingOrders] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderMigrationResult | null>(null);
  const [orderLimit, setOrderLimit] = useState<number>(100);

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  useEffect(() => {
    checkCredentials();
  }, []);

  async function checkCredentials() {
    setIsLoadingStatus(true);
    try {
      const res = await fetch("/api/admin/migrate/status");
      const data = await res.json();
      setCredentialsStatus(data);
    } catch {
      setCredentialsStatus({ configured: false });
    } finally {
      setIsLoadingStatus(false);
    }
  }

  async function handleImportProducts() {
    setIsImportingProducts(true);
    setProductResult(null);

    try {
      const params = new URLSearchParams({
        limit: productLimit.toString(),
        activeOnly: activeOnly.toString(),
        clear: clearExistingProducts.toString(),
      });

      const res = await fetch(`/api/admin/migrate?${params}`, {
        method: "POST",
      });
      const data: ProductMigrationResult = await res.json();
      setProductResult(data);
    } catch (error) {
      setProductResult({
        success: false,
        message: "Import failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsImportingProducts(false);
    }
  }

  async function handleClearProducts() {
    if (!confirm("Are you sure you want to clear ALL products? This cannot be undone.")) {
      return;
    }

    setIsClearingProducts(true);
    try {
      const res = await fetch("/api/admin/migrate", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProductResult({
          success: true,
          message: "All products cleared successfully",
        });
      } else {
        setProductResult({
          success: false,
          message: "Clear failed",
          error: data.error,
        });
      }
    } catch (error) {
      setProductResult({
        success: false,
        message: "Clear failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsClearingProducts(false);
    }
  }

  async function handleImportCustomers() {
    setIsImportingCustomers(true);
    setCustomerResult(null);

    try {
      const params = new URLSearchParams({
        limit: customerLimit.toString(),
      });

      const res = await fetch(`/api/admin/migrate/customers?${params}`, {
        method: "POST",
      });
      const data: CustomerMigrationResult = await res.json();
      setCustomerResult(data);
    } catch (error) {
      setCustomerResult({
        success: false,
        message: "Import failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsImportingCustomers(false);
    }
  }

  async function handleClearCustomers() {
    if (!confirm("Are you sure you want to clear ALL customers and their addresses? This cannot be undone.")) {
      return;
    }

    setIsClearingCustomers(true);
    try {
      const res = await fetch("/api/admin/migrate/customers", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCustomerResult({
          success: true,
          message: "All customers cleared successfully",
        });
      } else {
        setCustomerResult({
          success: false,
          message: "Clear failed",
          error: data.error,
        });
      }
    } catch (error) {
      setCustomerResult({
        success: false,
        message: "Clear failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsClearingCustomers(false);
    }
  }

  async function handleImportOrders() {
    setIsImportingOrders(true);
    setOrderResult(null);

    try {
      const params = new URLSearchParams({
        limit: orderLimit.toString(),
      });

      const res = await fetch(`/api/admin/migrate/orders?${params}`, {
        method: "POST",
      });
      const data: OrderMigrationResult = await res.json();
      setOrderResult(data);
    } catch (error) {
      setOrderResult({
        success: false,
        message: "Import failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsImportingOrders(false);
    }
  }

  async function handleClearOrders() {
    if (!confirm("Are you sure you want to clear ALL orders? This cannot be undone.")) {
      return;
    }

    setIsClearingOrders(true);
    try {
      const res = await fetch("/api/admin/migrate/orders", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setOrderResult({
          success: true,
          message: "All orders cleared successfully",
        });
      } else {
        setOrderResult({
          success: false,
          message: "Clear failed",
          error: data.error,
        });
      }
    } catch (error) {
      setOrderResult({
        success: false,
        message: "Clear failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsClearingOrders(false);
    }
  }

  async function handleValidate() {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch("/api/admin/migrate/validate");
      const data: ValidationResult = await res.json();
      setValidationResult(data);
    } catch (error) {
      console.error("Validation failed:", error);
    } finally {
      setIsValidating(false);
    }
  }

  const isAnyOperationRunning =
    isImportingProducts || isClearingProducts ||
    isImportingCustomers || isClearingCustomers ||
    isImportingOrders || isClearingOrders ||
    isValidating;

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
          Import your products, collections, customers, and orders from Shopify
        </p>
      </div>

      {/* Credentials Status */}
      <div className="max-w-2xl">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-start gap-4">
            {isLoadingStatus ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-0.5" />
            ) : credentialsStatus?.configured ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <h2 className="font-medium">Shopify Connection</h2>
              {isLoadingStatus ? (
                <p className="text-sm text-muted-foreground">Checking credentials...</p>
              ) : credentialsStatus?.configured ? (
                <p className="text-sm text-muted-foreground">
                  Connected to <span className="font-mono text-foreground">{credentialsStatus.domain}</span>
                </p>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Shopify API credentials are not configured.</p>
                  <p>Add the following environment variables:</p>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                    SHOPIFY_STORE_DOMAIN=your-store.myshopify.com{"\n"}
                    SHOPIFY_ACCESS_TOKEN=shpat_...
                  </pre>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={checkCredentials}
              disabled={isLoadingStatus}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingStatus ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {!credentialsStatus?.configured && !isLoadingStatus && (
            <>
              <hr className="border-border" />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
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

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild>
                  <Link href="/admin/products/new">Add Product Manually</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin">Back to Dashboard</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {credentialsStatus?.configured && (
        <>
          {/* Products Import Card */}
          <div className="max-w-2xl">
            <div className="rounded-lg border bg-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-medium">Products & Collections</h2>
                  <p className="text-sm text-muted-foreground">
                    Import products, variants, images, and collections
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="product-limit">Product Limit</Label>
                    <p className="text-xs text-muted-foreground">
                      Maximum number of products to import (1-250)
                    </p>
                  </div>
                  <Input
                    id="product-limit"
                    type="number"
                    min={1}
                    max={250}
                    value={productLimit}
                    onChange={(e) => setProductLimit(Math.min(250, Math.max(1, parseInt(e.target.value) || 20)))}
                    className="w-24"
                    disabled={isAnyOperationRunning}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="active-only">Active Products Only</Label>
                    <p className="text-xs text-muted-foreground">
                      Skip draft and archived products
                    </p>
                  </div>
                  <Switch
                    id="active-only"
                    checked={activeOnly}
                    onCheckedChange={setActiveOnly}
                    disabled={isAnyOperationRunning}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="clear-products" className="text-amber-600">Clear Existing</Label>
                    <p className="text-xs text-muted-foreground">
                      Delete all existing products before import
                    </p>
                  </div>
                  <Switch
                    id="clear-products"
                    checked={clearExistingProducts}
                    onCheckedChange={setClearExistingProducts}
                    disabled={isAnyOperationRunning}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleImportProducts}
                  disabled={isAnyOperationRunning}
                  className="flex-1"
                >
                  {isImportingProducts ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Importing Products...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Products
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleClearProducts}
                  disabled={isAnyOperationRunning}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isClearingProducts ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </>
                  )}
                </Button>
              </div>

              {productResult && (
                <div
                  className={`rounded-lg p-4 ${
                    productResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {productResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          productResult.success ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {productResult.message}
                      </p>

                      {productResult.success && productResult.productsImported !== undefined && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-green-700">
                            <Package className="h-4 w-4" />
                            <span>{productResult.productsImported} products</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-700">
                            <FolderOpen className="h-4 w-4" />
                            <span>{productResult.variantsImported} variants</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-700">
                            <ImageIcon className="h-4 w-4" />
                            <span>{productResult.imagesImported} images</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-700">
                            <FolderOpen className="h-4 w-4" />
                            <span>{productResult.collectionsImported} collections</span>
                          </div>
                        </div>
                      )}

                      {productResult.errors && productResult.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-amber-800 mb-1">
                            Warnings ({productResult.errors.length}):
                          </p>
                          <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                            {productResult.errors.map((err, i) => (
                              <li key={i}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {productResult.error && (
                        <p className="mt-2 text-sm text-red-700">{productResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customers Import Card */}
          <div className="max-w-2xl">
            <div className="rounded-lg border bg-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-medium">Customers & Addresses</h2>
                  <p className="text-sm text-muted-foreground">
                    Import customer records and their saved addresses
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="customer-limit">Customer Limit</Label>
                    <p className="text-xs text-muted-foreground">
                      Maximum number of customers to import (1-250)
                    </p>
                  </div>
                  <Input
                    id="customer-limit"
                    type="number"
                    min={1}
                    max={250}
                    value={customerLimit}
                    onChange={(e) => setCustomerLimit(Math.min(250, Math.max(1, parseInt(e.target.value) || 100)))}
                    className="w-24"
                    disabled={isAnyOperationRunning}
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> Existing customers (matched by email) will have their data updated.
                    Passwords cannot be migrated — customers will need to reset their passwords or use social login.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleImportCustomers}
                  disabled={isAnyOperationRunning}
                  className="flex-1"
                >
                  {isImportingCustomers ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Importing Customers...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Customers
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleClearCustomers}
                  disabled={isAnyOperationRunning}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isClearingCustomers ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </>
                  )}
                </Button>
              </div>

              {customerResult && (
                <div
                  className={`rounded-lg p-4 ${
                    customerResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {customerResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          customerResult.success ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {customerResult.message}
                      </p>

                      {customerResult.success && customerResult.customersImported !== undefined && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-green-700">
                            <Users className="h-4 w-4" />
                            <span>{customerResult.customersImported} new customers</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-700">
                            <Users className="h-4 w-4" />
                            <span>{customerResult.customersSkipped} updated</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-700">
                            <MapPin className="h-4 w-4" />
                            <span>{customerResult.addressesImported} addresses</span>
                          </div>
                        </div>
                      )}

                      {customerResult.errors && customerResult.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-amber-800 mb-1">
                            Warnings ({customerResult.errors.length}):
                          </p>
                          <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                            {customerResult.errors.map((err, i) => (
                              <li key={i}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {customerResult.error && (
                        <p className="mt-2 text-sm text-red-700">{customerResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Orders Import Card */}
          <div className="max-w-2xl">
            <div className="rounded-lg border bg-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-medium">Historical Orders</h2>
                  <p className="text-sm text-muted-foreground">
                    Import past orders and line items for customer history
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="order-limit">Order Limit</Label>
                    <p className="text-xs text-muted-foreground">
                      Maximum number of orders to import (1-250)
                    </p>
                  </div>
                  <Input
                    id="order-limit"
                    type="number"
                    min={1}
                    max={250}
                    value={orderLimit}
                    onChange={(e) => setOrderLimit(Math.min(250, Math.max(1, parseInt(e.target.value) || 100)))}
                    className="w-24"
                    disabled={isAnyOperationRunning}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Recommended:</strong> Import customers before orders so that orders can be linked to customer accounts.
                    Orders are matched by order number to avoid duplicates.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> Historical orders are imported for customer history only.
                    Payment details are not migrated (they were already processed in Shopify).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleImportOrders}
                  disabled={isAnyOperationRunning}
                  className="flex-1"
                >
                  {isImportingOrders ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Importing Orders...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Orders
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleClearOrders}
                  disabled={isAnyOperationRunning}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isClearingOrders ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </>
                  )}
                </Button>
              </div>

              {orderResult && (
                <div
                  className={`rounded-lg p-4 ${
                    orderResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {orderResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          orderResult.success ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {orderResult.message}
                      </p>

                      {orderResult.success && orderResult.ordersImported !== undefined && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-green-700">
                            <ShoppingCart className="h-4 w-4" />
                            <span>{orderResult.ordersImported} new orders</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-700">
                            <ShoppingCart className="h-4 w-4" />
                            <span>{orderResult.ordersSkipped} skipped</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-700">
                            <FileText className="h-4 w-4" />
                            <span>{orderResult.orderItemsImported} line items</span>
                          </div>
                        </div>
                      )}

                      {orderResult.errors && orderResult.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-amber-800 mb-1">
                            Warnings ({orderResult.errors.length}):
                          </p>
                          <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                            {orderResult.errors.map((err, i) => (
                              <li key={i}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {orderResult.error && (
                        <p className="mt-2 text-sm text-red-700">{orderResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation Card */}
          <div className="max-w-2xl">
            <div className="rounded-lg border bg-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <ClipboardCheck className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-medium">Data Validation</h2>
                  <p className="text-sm text-muted-foreground">
                    Validate migrated data integrity and completeness
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Checks performed:</strong> Record counts, product/variant relationships,
                  customer emails, order integrity, image accessibility, and redirect configuration.
                </p>
              </div>

              <Button
                onClick={handleValidate}
                disabled={isAnyOperationRunning}
                className="w-full"
                variant="outline"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Run Validation
                  </>
                )}
              </Button>

              {validationResult && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div
                    className={`rounded-lg p-4 ${
                      validationResult.summary.status === "passed"
                        ? "bg-green-50 border border-green-200"
                        : validationResult.summary.status === "warning"
                        ? "bg-amber-50 border border-amber-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {validationResult.summary.status === "passed" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : validationResult.summary.status === "warning" ? (
                        <TriangleAlert className="h-5 w-5 text-amber-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span
                        className={`font-medium ${
                          validationResult.summary.status === "passed"
                            ? "text-green-800"
                            : validationResult.summary.status === "warning"
                            ? "text-amber-800"
                            : "text-red-800"
                        }`}
                      >
                        {validationResult.summary.status === "passed"
                          ? "All Checks Passed"
                          : validationResult.summary.status === "warning"
                          ? "Passed with Warnings"
                          : "Validation Failed"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white/50 rounded p-2">
                        <div className="text-lg font-semibold text-green-600">
                          {validationResult.summary.passed}
                        </div>
                        <div className="text-xs text-muted-foreground">Passed</div>
                      </div>
                      <div className="bg-white/50 rounded p-2">
                        <div className="text-lg font-semibold text-amber-600">
                          {validationResult.summary.warnings}
                        </div>
                        <div className="text-xs text-muted-foreground">Warnings</div>
                      </div>
                      <div className="bg-white/50 rounded p-2">
                        <div className="text-lg font-semibold text-red-600">
                          {validationResult.summary.failed}
                        </div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  </div>

                  {/* Record Counts */}
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-3">Record Counts</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {Object.entries(validationResult.counts).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Checks */}
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-3">Validation Checks</h3>
                    <div className="space-y-2">
                      {validationResult.checks.map((check, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm py-1 border-b last:border-0"
                        >
                          {check.status === "pass" ? (
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          ) : check.status === "warning" ? (
                            <TriangleAlert className="h-4 w-4 text-amber-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                          <span className="text-muted-foreground">[{check.category}]</span>
                          <span className="flex-1">{check.check}</span>
                          <span
                            className={`text-xs ${
                              check.status === "pass"
                                ? "text-green-600"
                                : check.status === "warning"
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {check.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Validated at {new Date(validationResult.validatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
