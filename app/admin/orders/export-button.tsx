"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportOrdersButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Build URL with date params
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const url = `/api/admin/orders/export${params.toString() ? `?${params}` : ""}`;

      // Fetch the CSV
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "orders.csv";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      // Reset and close date picker
      setShowDateRange(false);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export orders. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Quick export presets
  const setLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(now.toISOString().split("T")[0]);
  };

  const setLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowDateRange(!showDateRange)}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </>
        )}
      </Button>

      {showDateRange && (
        <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-4 z-50 w-80">
          <h4 className="font-medium text-sm mb-3">Export Date Range</h4>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={setLast30Days}
              className="text-xs px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded"
            >
              Last 30 days
            </button>
            <button
              type="button"
              onClick={setThisMonth}
              className="text-xs px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded"
            >
              This month
            </button>
            <button
              type="button"
              onClick={setLastMonth}
              className="text-xs px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded"
            >
              Last month
            </button>
            <button
              type="button"
              onClick={clearDates}
              className="text-xs px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded"
            >
              All time
            </button>
          </div>

          {/* Date inputs */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Download"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDateRange(false)}
            >
              Cancel
            </Button>
          </div>

          {/* Date range summary */}
          {(startDate || endDate) && (
            <p className="text-xs text-stone-500 mt-2">
              {startDate && endDate
                ? `${startDate} to ${endDate}`
                : startDate
                ? `From ${startDate}`
                : `Until ${endDate}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
