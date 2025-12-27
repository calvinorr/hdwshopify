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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CredentialsStatus {
  configured: boolean;
  domain?: string;
}

interface MigrationResult {
  success: boolean;
  message: string;
  productsImported?: number;
  variantsImported?: number;
  imagesImported?: number;
  collectionsImported?: number;
  errors?: string[];
  error?: string;
}

export default function ImportPage() {
  const [credentialsStatus, setCredentialsStatus] = useState<CredentialsStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [importResult, setImportResult] = useState<MigrationResult | null>(null);

  // Import options
  const [productLimit, setProductLimit] = useState<number>(20);
  const [activeOnly, setActiveOnly] = useState(true);
  const [clearExisting, setClearExisting] = useState(false);

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

  async function handleImport() {
    setIsImporting(true);
    setImportResult(null);

    try {
      const params = new URLSearchParams({
        limit: productLimit.toString(),
        activeOnly: activeOnly.toString(),
        clear: clearExisting.toString(),
      });

      const res = await fetch(`/api/admin/migrate?${params}`, {
        method: "POST",
      });
      const data: MigrationResult = await res.json();
      setImportResult(data);
    } catch (error) {
      setImportResult({
        success: false,
        message: "Import failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsImporting(false);
    }
  }

  async function handleClear() {
    if (!confirm("Are you sure you want to clear ALL products? This cannot be undone.")) {
      return;
    }

    setIsClearing(true);
    try {
      const res = await fetch("/api/admin/migrate", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setImportResult({
          success: true,
          message: "All products cleared successfully",
        });
      } else {
        setImportResult({
          success: false,
          message: "Clear failed",
          error: data.error,
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: "Clear failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsClearing(false);
    }
  }

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
          Import your products, collections, and images from Shopify
        </p>
      </div>

      {/* Credentials Status */}
      <div className="max-w-2xl">
        <div className="rounded-lg border bg-card p-6 space-y-6">
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

          {credentialsStatus?.configured && (
            <>
              <hr className="border-border" />

              {/* Import Options */}
              <div className="space-y-4">
                <h3 className="font-medium">Import Options</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="limit">Product Limit</Label>
                      <p className="text-xs text-muted-foreground">
                        Maximum number of products to import (1-250)
                      </p>
                    </div>
                    <Input
                      id="limit"
                      type="number"
                      min={1}
                      max={250}
                      value={productLimit}
                      onChange={(e) => setProductLimit(Math.min(250, Math.max(1, parseInt(e.target.value) || 20)))}
                      className="w-24"
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
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="clear-existing" className="text-amber-600">Clear Existing</Label>
                      <p className="text-xs text-muted-foreground">
                        Delete all existing products before import
                      </p>
                    </div>
                    <Switch
                      id="clear-existing"
                      checked={clearExisting}
                      onCheckedChange={setClearExisting}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-border" />

              {/* Import Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={isImporting || isClearing}
                  className="flex-1"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={isImporting || isClearing}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isClearing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </>
                  )}
                </Button>
              </div>

              {/* Import Result */}
              {importResult && (
                <div
                  className={`rounded-lg p-4 ${
                    importResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {importResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          importResult.success ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {importResult.message}
                      </p>

                      {importResult.success && importResult.productsImported !== undefined && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-green-700">
                            <Package className="h-4 w-4" />
                            <span>{importResult.productsImported} products</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-700">
                            <FolderOpen className="h-4 w-4" />
                            <span>{importResult.variantsImported} variants</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-700">
                            <ImageIcon className="h-4 w-4" />
                            <span>{importResult.imagesImported} images</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-700">
                            <FolderOpen className="h-4 w-4" />
                            <span>{importResult.collectionsImported} collections</span>
                          </div>
                        </div>
                      )}

                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-amber-800 mb-1">
                            Warnings ({importResult.errors.length}):
                          </p>
                          <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                            {importResult.errors.map((err, i) => (
                              <li key={i}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {importResult.error && (
                        <p className="mt-2 text-sm text-red-700">{importResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

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
    </div>
  );
}
