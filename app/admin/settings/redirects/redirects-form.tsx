"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, ArrowRight, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Redirect {
  id: number;
  fromPath: string;
  toPath: string;
  statusCode: number | null;
  hits: number | null;
  active: boolean | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface RedirectsFormProps {
  redirects: Redirect[];
}

export function RedirectsForm({ redirects: initialRedirects }: RedirectsFormProps) {
  const [redirects, setRedirects] = useState<Redirect[]>(initialRedirects);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [selectedRedirect, setSelectedRedirect] = useState<Redirect | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [statusCode, setStatusCode] = useState("301");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setFromPath("");
    setToPath("");
    setStatusCode("301");
    setNotes("");
  };

  const openEditDialog = (redirect: Redirect) => {
    setSelectedRedirect(redirect);
    setFromPath(redirect.fromPath);
    setToPath(redirect.toPath);
    setStatusCode(String(redirect.statusCode || 301));
    setNotes(redirect.notes || "");
    setIsEditDialogOpen(true);
  };

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromPath,
          toPath,
          statusCode: parseInt(statusCode),
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to create redirect");
        return;
      }

      const { redirect } = await response.json();
      setRedirects([redirect, ...redirects]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating redirect:", error);
      toast.error("Failed to create redirect");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedRedirect) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/redirects/${selectedRedirect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromPath,
          toPath,
          statusCode: parseInt(statusCode),
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to update redirect");
        return;
      }

      const { redirect } = await response.json();
      setRedirects(redirects.map((r) => (r.id === redirect.id ? redirect : r)));
      setIsEditDialogOpen(false);
      setSelectedRedirect(null);
      resetForm();
    } catch (error) {
      console.error("Error updating redirect:", error);
      toast.error("Failed to update redirect");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (redirect: Redirect) => {
    try {
      const response = await fetch(`/api/admin/redirects/${redirect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !redirect.active }),
      });

      if (!response.ok) {
        toast.error("Failed to toggle redirect");
        return;
      }

      const { redirect: updated } = await response.json();
      setRedirects(redirects.map((r) => (r.id === updated.id ? updated : r)));
    } catch (error) {
      console.error("Error toggling redirect:", error);
      toast.error("Failed to toggle redirect");
    }
  };

  const handleDelete = async () => {
    if (!selectedRedirect) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/redirects/${selectedRedirect.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Failed to delete redirect");
        return;
      }

      setRedirects(redirects.filter((r) => r.id !== selectedRedirect.id));
      setIsDeleteDialogOpen(false);
      setSelectedRedirect(null);
    } catch (error) {
      console.error("Error deleting redirect:", error);
      toast.error("Failed to delete redirect");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/redirects", {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Failed to clear redirects");
        return;
      }

      setRedirects([]);
      setIsClearDialogOpen(false);
    } catch (error) {
      console.error("Error clearing redirects:", error);
      toast.error("Failed to clear redirects");
    } finally {
      setIsLoading(false);
    }
  };

  const totalHits = redirects.reduce((sum, r) => sum + (r.hits || 0), 0);
  const activeCount = redirects.filter((r) => r.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/settings"
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-semibold text-stone-900">
              URL Redirects
            </h1>
            <p className="text-stone-600 mt-1">
              Manage 301/302 redirects for SEO and migrated URLs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {redirects.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsClearDialogOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear All
            </Button>
          )}
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Redirect
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-semibold text-stone-900">{redirects.length}</div>
          <div className="text-sm text-stone-500">Total Redirects</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-semibold text-green-600">{activeCount}</div>
          <div className="text-sm text-stone-500">Active</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-semibold text-blue-600">{totalHits.toLocaleString()}</div>
          <div className="text-sm text-stone-500">Total Hits</div>
        </div>
      </div>

      {/* Redirects Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {redirects.length === 0 ? (
          <div className="p-12 text-center">
            <ExternalLink className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-900 mb-2">No redirects yet</h3>
            <p className="text-stone-500 mb-4">
              Create redirects to preserve SEO when migrating from Shopify
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Redirect
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b">
                <tr>
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    From
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    To
                  </th>
                  <th className="text-center text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Code
                  </th>
                  <th className="text-center text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Hits
                  </th>
                  <th className="text-center text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Active
                  </th>
                  <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {redirects.map((redirect) => (
                  <tr key={redirect.id} className={redirect.active ? "" : "bg-stone-50 opacity-60"}>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-stone-100 px-2 py-1 rounded">
                        {redirect.fromPath}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-stone-400" />
                        <code className="text-sm bg-green-50 text-green-700 px-2 py-1 rounded">
                          {redirect.toPath}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          redirect.statusCode === 301
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {redirect.statusCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-stone-600">
                      {(redirect.hits || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(redirect)}
                        className="inline-flex items-center justify-center"
                        title={redirect.active ? "Click to deactivate" : "Click to activate"}
                      >
                        {redirect.active ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-stone-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditDialog(redirect)}
                          className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRedirect(redirect);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Redirect</DialogTitle>
            <DialogDescription>
              Create a new URL redirect to preserve SEO value
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fromPath">From Path</Label>
              <Input
                id="fromPath"
                placeholder="/old-products/yarn-name"
                value={fromPath}
                onChange={(e) => setFromPath(e.target.value)}
              />
              <p className="text-xs text-stone-500">The old URL path that should redirect</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="toPath">To Path</Label>
              <Input
                id="toPath"
                placeholder="/products/new-yarn-name"
                value={toPath}
                onChange={(e) => setToPath(e.target.value)}
              />
              <p className="text-xs text-stone-500">The new URL path to redirect to</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusCode">Status Code</Label>
              <Select value={statusCode} onValueChange={setStatusCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 - Permanent Redirect</SelectItem>
                  <SelectItem value="302">302 - Temporary Redirect</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Reason for redirect, original Shopify URL, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!fromPath || !toPath || isLoading}>
              {isLoading ? "Creating..." : "Create Redirect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Redirect</DialogTitle>
            <DialogDescription>Update the redirect settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFromPath">From Path</Label>
              <Input
                id="editFromPath"
                value={fromPath}
                onChange={(e) => setFromPath(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editToPath">To Path</Label>
              <Input
                id="editToPath"
                value={toPath}
                onChange={(e) => setToPath(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatusCode">Status Code</Label>
              <Select value={statusCode} onValueChange={setStatusCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 - Permanent Redirect</SelectItem>
                  <SelectItem value="302">302 - Temporary Redirect</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!fromPath || !toPath || isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Redirect?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the redirect from{" "}
              <code className="bg-stone-100 px-1 rounded">{selectedRedirect?.fromPath}</code>.
              Traffic to this URL will no longer be redirected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Redirects?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {redirects.length} redirects. This action cannot
              be undone and may break incoming links to your site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Clearing..." : "Clear All Redirects"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
