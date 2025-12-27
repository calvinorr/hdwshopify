"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface WeightType {
  id: number;
  name: string;
  label: string;
  description: string | null;
  sortOrder: number | null;
  active: boolean | null;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  productCount: number;
}

interface Props {
  weightTypes: WeightType[];
  tags: Tag[];
}

export function TaxonomiesForm({
  weightTypes: initialWeights,
  tags: initialTags,
}: Props) {
  const router = useRouter();
  const [weights, setWeights] = useState(initialWeights);
  const [tags, setTags] = useState(initialTags);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Weight type editing
  const [editingWeightId, setEditingWeightId] = useState<number | null>(null);
  const [newWeight, setNewWeight] = useState({ name: "", label: "", description: "" });
  const [showAddWeight, setShowAddWeight] = useState(false);

  // Tag editing
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [newTag, setNewTag] = useState({ name: "", color: "#6b7280" });
  const [showAddTag, setShowAddTag] = useState(false);

  // Weight Types CRUD
  const handleAddWeight = async () => {
    if (!newWeight.name || !newWeight.label) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/taxonomies/weight-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newWeight,
          sortOrder: weights.length,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const created = await response.json();
      setWeights([...weights, created]);
      setNewWeight({ name: "", label: "", description: "" });
      setShowAddWeight(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add weight type");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWeight = async (weight: WeightType) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/taxonomies/weight-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weight),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const updated = await response.json();
      setWeights(weights.map((w) => (w.id === updated.id ? updated : w)));
      setEditingWeightId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update weight type");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWeight = async (id: number) => {
    if (!confirm("Delete this weight type?")) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/taxonomies/weight-types?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setWeights(weights.filter((w) => w.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete weight type");
    } finally {
      setSaving(false);
    }
  };

  // Tags CRUD
  const handleAddTag = async () => {
    if (!newTag.name) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/taxonomies/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTag),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const created = await response.json();
      setTags([...tags, created]);
      setNewTag({ name: "", color: "#6b7280" });
      setShowAddTag(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add tag");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTag = async (tag: Tag) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/taxonomies/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tag),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const updated = await response.json();
      setTags(tags.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      setEditingTagId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tag");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (id: number, productCount: number) => {
    const message = productCount > 0
      ? `This tag is used by ${productCount} product(s). Delete anyway?`
      : "Delete this tag?";
    if (!confirm(message)) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/taxonomies/tags?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setTags(tags.filter((t) => t.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-semibold text-stone-900">
            Taxonomies
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage product weight types and tags
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Tabs defaultValue="weights" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="weights">Weight Types</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        {/* Weight Types Tab */}
        <TabsContent value="weights" className="mt-6">
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-medium text-stone-900">Yarn Weight Types</h2>
                <p className="text-sm text-stone-500">
                  Define the yarn weight categories for your products
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddWeight(true)}
                disabled={showAddWeight}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Weight
              </Button>
            </div>

            <div className="divide-y">
              {/* Add new weight form */}
              {showAddWeight && (
                <div className="p-4 bg-stone-50">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name (ID)</Label>
                      <Input
                        value={newWeight.name}
                        onChange={(e) =>
                          setNewWeight({ ...newWeight, name: e.target.value })
                        }
                        placeholder="e.g., DK"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Display Label</Label>
                      <Input
                        value={newWeight.label}
                        onChange={(e) =>
                          setNewWeight({ ...newWeight, label: e.target.value })
                        }
                        placeholder="e.g., DK (Double Knitting)"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={newWeight.description}
                        onChange={(e) =>
                          setNewWeight({ ...newWeight, description: e.target.value })
                        }
                        placeholder="Optional"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handleAddWeight} disabled={saving}>
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAddWeight(false);
                        setNewWeight({ name: "", label: "", description: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Weight types list */}
              {weights.length === 0 && !showAddWeight ? (
                <div className="p-8 text-center text-stone-500">
                  No weight types defined. Add one to get started.
                </div>
              ) : (
                weights.map((weight) => (
                  <div
                    key={weight.id}
                    className="p-4 flex items-center gap-4 hover:bg-stone-50"
                  >
                    <GripVertical className="h-5 w-5 text-stone-300 cursor-grab" />

                    {editingWeightId === weight.id ? (
                      <div className="flex-1 grid gap-3 sm:grid-cols-3">
                        <Input
                          value={weight.name}
                          onChange={(e) =>
                            setWeights(
                              weights.map((w) =>
                                w.id === weight.id
                                  ? { ...w, name: e.target.value }
                                  : w
                              )
                            )
                          }
                          className="h-9"
                        />
                        <Input
                          value={weight.label}
                          onChange={(e) =>
                            setWeights(
                              weights.map((w) =>
                                w.id === weight.id
                                  ? { ...w, label: e.target.value }
                                  : w
                              )
                            )
                          }
                          className="h-9"
                        />
                        <Input
                          value={weight.description || ""}
                          onChange={(e) =>
                            setWeights(
                              weights.map((w) =>
                                w.id === weight.id
                                  ? { ...w, description: e.target.value }
                                  : w
                              )
                            )
                          }
                          className="h-9"
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-900">
                            {weight.label}
                          </span>
                          <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                            {weight.name}
                          </span>
                          {weight.active === false && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        {weight.description && (
                          <p className="text-sm text-stone-500 mt-1">
                            {weight.description}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      {editingWeightId === weight.id ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleUpdateWeight(weight)}
                            disabled={saving}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingWeightId(null);
                              setWeights(initialWeights);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditingWeightId(weight.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteWeight(weight.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="mt-6">
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-medium text-stone-900">Product Tags</h2>
                <p className="text-sm text-stone-500">
                  Create tags to organize and filter products
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddTag(true)}
                disabled={showAddTag}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tag
              </Button>
            </div>

            <div className="divide-y">
              {/* Add new tag form */}
              {showAddTag && (
                <div className="p-4 bg-stone-50">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Tag Name</Label>
                      <Input
                        value={newTag.name}
                        onChange={(e) =>
                          setNewTag({ ...newTag, name: e.target.value })
                        }
                        placeholder="e.g., Hand-dyed"
                        className="h-9"
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">Color</Label>
                      <Input
                        type="color"
                        value={newTag.color}
                        onChange={(e) =>
                          setNewTag({ ...newTag, color: e.target.value })
                        }
                        className="h-9 p-1 cursor-pointer"
                      />
                    </div>
                    <Button size="sm" onClick={handleAddTag} disabled={saving}>
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAddTag(false);
                        setNewTag({ name: "", color: "#6b7280" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Tags list */}
              {tags.length === 0 && !showAddTag ? (
                <div className="p-8 text-center text-stone-500">
                  No tags defined. Add one to get started.
                </div>
              ) : (
                <div className="p-4 flex flex-wrap gap-3">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="group relative inline-flex items-center gap-2 bg-stone-100 rounded-full pl-1 pr-3 py-1"
                    >
                      {editingTagId === tag.id ? (
                        <div className="flex items-center gap-2 px-2">
                          <input
                            type="color"
                            value={tag.color || "#6b7280"}
                            onChange={(e) =>
                              setTags(
                                tags.map((t) =>
                                  t.id === tag.id
                                    ? { ...t, color: e.target.value }
                                    : t
                                )
                              )
                            }
                            className="w-6 h-6 rounded cursor-pointer border-0"
                          />
                          <Input
                            value={tag.name}
                            onChange={(e) =>
                              setTags(
                                tags.map((t) =>
                                  t.id === tag.id
                                    ? { ...t, name: e.target.value }
                                    : t
                                )
                              )
                            }
                            className="h-7 w-32 text-sm"
                          />
                          <button
                            onClick={() => handleUpdateTag(tag)}
                            className="p-1 hover:bg-stone-200 rounded"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTagId(null);
                              setTags(initialTags);
                            }}
                            className="p-1 hover:bg-stone-200 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className="w-5 h-5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color || "#6b7280" }}
                          />
                          <span className="text-sm font-medium text-stone-700">
                            {tag.name}
                          </span>
                          {tag.productCount > 0 && (
                            <span className="text-xs text-stone-400">
                              ({tag.productCount})
                            </span>
                          )}

                          {/* Edit/Delete buttons on hover */}
                          <div className="hidden group-hover:flex items-center gap-1 ml-1">
                            <button
                              onClick={() => setEditingTagId(tag.id)}
                              className="p-1 hover:bg-stone-200 rounded"
                            >
                              <Edit2 className="h-3 w-3 text-stone-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.id, tag.productCount)}
                              className="p-1 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
