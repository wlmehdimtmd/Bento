"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type {
  BusinessType,
  CategoryTemplate,
  ProductTemplate,
  BundleTemplate,
  BundleTemplateSlot,
} from "@/lib/types";

interface Props {
  initialBusinessTypes: BusinessType[];
  initialCategories: CategoryTemplate[];
  initialProducts: ProductTemplate[];
  initialBundles: BundleTemplate[];
  initialSlots: BundleTemplateSlot[];
}

export function AdminTemplatesClient({
  initialBusinessTypes,
  initialCategories,
  initialProducts,
  initialBundles,
  initialSlots,
}: Props) {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>(initialBusinessTypes);
  const [categories, setCategories] = useState<CategoryTemplate[]>(initialCategories);
  const [products, setProducts] = useState<ProductTemplate[]>(initialProducts);
  const [bundles, setBundles] = useState<BundleTemplate[]>(initialBundles);
  const [slots, setSlots] = useState<BundleTemplateSlot[]>(initialSlots);

  /* Tables admin (templates) absentes des types Supabase générés */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accès .from() sur tables hors schéma typé
  const supabase: any = createClient();

  // ── Business Types ────────────────────────────────────────────────────────────

  const [btForm, setBtForm] = useState<Partial<BusinessType>>({});
  const [btOpen, setBtOpen] = useState(false);
  const [btDeleteId, setBtDeleteId] = useState<string | null>(null);
  const [btSaving, setBtSaving] = useState(false);

  function openBtCreate() {
    setBtForm({ is_active: true, position: businessTypes.length });
    setBtOpen(true);
  }

  function openBtEdit(bt: BusinessType) {
    setBtForm(bt);
    setBtOpen(true);
  }

  async function saveBt() {
    if (!btForm.name?.trim() || !btForm.slug?.trim()) {
      toast.error("Nom et slug requis.");
      return;
    }
    setBtSaving(true);
    const payload = {
      name: btForm.name!.trim(),
      slug: btForm.slug!.trim(),
      icon: btForm.icon ?? null,
      description: btForm.description ?? null,
      position: btForm.position ?? 0,
      is_active: btForm.is_active ?? true,
    };

    if (btForm.id) {
      const { error } = await supabase.from("business_types").update(payload).eq("id", btForm.id);
      if (error) { toast.error(error.message); }
      else {
        setBusinessTypes((prev) => prev.map((bt) => bt.id === btForm.id ? { ...bt, ...payload } : bt));
        toast.success("Type mis à jour.");
        setBtOpen(false);
      }
    } else {
      const { data, error } = await supabase.from("business_types").insert(payload).select().single();
      if (error) { toast.error(error.message); }
      else {
        setBusinessTypes((prev) => [...prev, data as BusinessType]);
        toast.success("Type créé.");
        setBtOpen(false);
      }
    }
    setBtSaving(false);
  }

  async function deleteBt(id: string) {
    const { error } = await supabase.from("business_types").delete().eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      setBusinessTypes((prev) => prev.filter((bt) => bt.id !== id));
      setCategories((prev) => prev.filter((c) => c.business_type_id !== id));
      toast.success("Type supprimé.");
      setBtDeleteId(null);
    }
  }

  async function toggleBtActive(bt: BusinessType) {
    const newVal = !bt.is_active;
    const { error } = await supabase.from("business_types").update({ is_active: newVal }).eq("id", bt.id);
    if (error) { toast.error(error.message); }
    else setBusinessTypes((prev) => prev.map((b) => b.id === bt.id ? { ...b, is_active: newVal } : b));
  }

  // ── Category Templates ────────────────────────────────────────────────────────

  const [catForm, setCatForm] = useState<Partial<CategoryTemplate>>({});
  const [catOpen, setCatOpen] = useState(false);
  const [catDeleteId, setCatDeleteId] = useState<string | null>(null);
  const [catSaving, setCatSaving] = useState(false);
  const [expandedBt, setExpandedBt] = useState<Set<string>>(new Set(initialBusinessTypes.map((b) => b.id)));
  const [filterBtId, setFilterBtId] = useState<string>("all");

  function openCatCreate(btId: string) {
    const pos = categories.filter((c) => c.business_type_id === btId).length;
    setCatForm({ business_type_id: btId, is_active: true, position: pos });
    setCatOpen(true);
  }

  function openCatEdit(cat: CategoryTemplate) {
    setCatForm(cat);
    setCatOpen(true);
  }

  async function saveCat() {
    if (!catForm.name?.trim() || !catForm.business_type_id) {
      toast.error("Nom et type requis.");
      return;
    }
    setCatSaving(true);
    const payload = {
      business_type_id: catForm.business_type_id!,
      name: catForm.name!.trim(),
      description: catForm.description ?? null,
      icon: catForm.icon ?? null,
      position: catForm.position ?? 0,
      is_active: catForm.is_active ?? true,
    };

    if (catForm.id) {
      const { error } = await supabase.from("category_templates").update(payload).eq("id", catForm.id);
      if (error) { toast.error(error.message); }
      else {
        setCategories((prev) => prev.map((c) => c.id === catForm.id ? { ...c, ...payload } : c));
        toast.success("Catégorie mise à jour.");
        setCatOpen(false);
      }
    } else {
      const { data, error } = await supabase.from("category_templates").insert(payload).select().single();
      if (error) { toast.error(error.message); }
      else {
        setCategories((prev) => [...prev, data as CategoryTemplate]);
        toast.success("Catégorie créée.");
        setCatOpen(false);
      }
    }
    setCatSaving(false);
  }

  async function deleteCat(id: string) {
    const { error } = await supabase.from("category_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setProducts((prev) => prev.filter((p) => p.category_template_id !== id));
      toast.success("Catégorie supprimée.");
      setCatDeleteId(null);
    }
  }

  // ── Product Templates ─────────────────────────────────────────────────────────

  const [prodForm, setProdForm] = useState<Partial<ProductTemplate> & { tagsStr?: string }>({});
  const [prodOpen, setProdOpen] = useState(false);
  const [prodDeleteId, setProdDeleteId] = useState<string | null>(null);
  const [prodSaving, setProdSaving] = useState(false);
  const [expandedCat, setExpandedCat] = useState<Set<string>>(new Set());

  function openProdCreate(catId: string) {
    const pos = products.filter((p) => p.category_template_id === catId).length;
    setProdForm({ category_template_id: catId, is_active: true, position: pos, tagsStr: "" });
    setProdOpen(true);
  }

  function openProdEdit(prod: ProductTemplate) {
    setProdForm({ ...prod, tagsStr: (prod.tags ?? []).join(", ") });
    setProdOpen(true);
  }

  async function saveProd() {
    if (!prodForm.name?.trim() || !prodForm.category_template_id) {
      toast.error("Nom et catégorie requis.");
      return;
    }
    setProdSaving(true);
    const payload = {
      category_template_id: prodForm.category_template_id!,
      name: prodForm.name!.trim(),
      description: prodForm.description ?? null,
      default_price: prodForm.default_price ?? null,
      tags: (prodForm.tagsStr ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      option_label: prodForm.option_label ?? null,
      position: prodForm.position ?? 0,
      is_active: prodForm.is_active ?? true,
    };

    if (prodForm.id) {
      const { error } = await supabase.from("product_templates").update(payload).eq("id", prodForm.id);
      if (error) { toast.error(error.message); }
      else {
        setProducts((prev) => prev.map((p) => p.id === prodForm.id ? { ...p, ...payload } : p));
        toast.success("Produit mis à jour.");
        setProdOpen(false);
      }
    } else {
      const { data, error } = await supabase.from("product_templates").insert(payload).select().single();
      if (error) { toast.error(error.message); }
      else {
        setProducts((prev) => [...prev, data as ProductTemplate]);
        toast.success("Produit créé.");
        setProdOpen(false);
      }
    }
    setProdSaving(false);
  }

  async function deleteProd(id: string) {
    const { error } = await supabase.from("product_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Produit supprimé.");
      setProdDeleteId(null);
    }
  }

  // ── Bundle Templates ──────────────────────────────────────────────────────────

  const [bundleForm, setBundleForm] = useState<Partial<BundleTemplate>>({});
  const [bundleSlotForms, setBundleSlotForms] = useState<{ category_template_id: string }[]>([]);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [bundleDeleteId, setBundleDeleteId] = useState<string | null>(null);
  const [bundleSaving, setBundleSaving] = useState(false);
  const [filterBtIdBundles, setFilterBtIdBundles] = useState<string>("all");

  function openBundleCreate(btId: string) {
    setBundleForm({ business_type_id: btId, is_active: true, position: bundles.filter((b) => b.business_type_id === btId).length });
    setBundleSlotForms([{ category_template_id: "" }]);
    setBundleOpen(true);
  }

  function openBundleEdit(bundle: BundleTemplate) {
    setBundleForm(bundle);
    const bundleSlots = slots.filter((s) => s.bundle_template_id === bundle.id);
    setBundleSlotForms(
      bundleSlots.map((s) => ({ category_template_id: s.category_template_id ?? "" }))
    );
    setBundleOpen(true);
  }

  async function saveBundle() {
    if (!bundleForm.name?.trim() || !bundleForm.business_type_id) {
      toast.error("Nom et type requis.");
      return;
    }
    setBundleSaving(true);
    const payload = {
      business_type_id: bundleForm.business_type_id!,
      name: bundleForm.name!.trim(),
      description: bundleForm.description ?? null,
      default_price: bundleForm.default_price ?? null,
      position: bundleForm.position ?? 0,
      is_active: bundleForm.is_active ?? true,
    };

    let bundleId = bundleForm.id;

    if (bundleId) {
      const { error } = await supabase.from("bundle_templates").update(payload).eq("id", bundleId);
      if (error) { toast.error(error.message); setBundleSaving(false); return; }
      setBundles((prev) => prev.map((b) => b.id === bundleId ? { ...b, ...payload } : b));
      // Delete existing slots and re-insert
      await supabase.from("bundle_template_slots").delete().eq("bundle_template_id", bundleId);
    } else {
      const { data, error } = await supabase.from("bundle_templates").insert(payload).select().single();
      if (error) { toast.error(error.message); setBundleSaving(false); return; }
      bundleId = (data as BundleTemplate).id;
      setBundles((prev) => [...prev, data as BundleTemplate]);
    }

    // Insert slots
    const validSlots = bundleSlotForms.filter((s) => s.category_template_id.trim());
    if (validSlots.length > 0) {
      const slotPayload = validSlots.map((s, i) => {
        const catName =
          categories.find((c) => c.id === s.category_template_id)?.name?.trim() || "Choix";
        return {
          bundle_template_id: bundleId!,
          label: catName,
          category_template_id: s.category_template_id || null,
          position: i,
        };
      });
      const { data: newSlots, error: slotError } = await supabase
        .from("bundle_template_slots")
        .insert(slotPayload)
        .select();
      if (slotError) { toast.error(slotError.message); }
      else {
        setSlots((prev) => [...prev.filter((s) => s.bundle_template_id !== bundleId), ...(newSlots as BundleTemplateSlot[])]);
      }
    }

    toast.success(bundleForm.id ? "Formule mise à jour." : "Formule créée.");
    setBundleOpen(false);
    setBundleSaving(false);
  }

  async function deleteBundle(id: string) {
    const { error } = await supabase.from("bundle_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      setBundles((prev) => prev.filter((b) => b.id !== id));
      setSlots((prev) => prev.filter((s) => s.bundle_template_id !== id));
      toast.success("Formule supprimée.");
      setBundleDeleteId(null);
    }
  }

  // ── Filtered data ────────────────────────────────────────────────────────────

  const filteredCats = useMemo(() =>
    categories.filter((c) => filterBtId === "all" || c.business_type_id === filterBtId),
    [categories, filterBtId]
  );

  const filteredBundles = useMemo(() =>
    bundles.filter((b) => filterBtIdBundles === "all" || b.business_type_id === filterBtIdBundles),
    [bundles, filterBtIdBundles]
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Tabs defaultValue="types">
        <TabsList className="mb-6">
          <TabsTrigger value="types">Types de commerce</TabsTrigger>
          <TabsTrigger value="cats">Catégories & Produits</TabsTrigger>
          <TabsTrigger value="bundles">Formules</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Business Types ── */}
        <TabsContent value="types" className="space-y-4">
          <Button size="sm" onClick={openBtCreate} style={{ backgroundColor: "var(--primary)" }} className="text-primary-foreground hover:opacity-90">
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter un type
          </Button>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-4 py-2.5 font-medium">Icône</th>
                  <th className="px-4 py-2.5 font-medium">Nom</th>
                  <th className="px-4 py-2.5 font-medium">Slug</th>
                  <th className="px-4 py-2.5 font-medium">Position</th>
                  <th className="px-4 py-2.5 font-medium">Actif</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {businessTypes.sort((a, b) => a.position - b.position).map((bt) => (
                  <tr key={bt.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-xl">{bt.icon}</td>
                    <td className="px-4 py-2.5 font-medium">{bt.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{bt.slug}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{bt.position}</td>
                    <td className="px-4 py-2.5">
                      <Switch checked={bt.is_active} onCheckedChange={() => toggleBtActive(bt)} size="sm" />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openBtEdit(bt)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setBtDeleteId(bt.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {businessTypes.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucun type de commerce.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Tab 2: Categories & Products ── */}
        <TabsContent value="cats" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={filterBtId}
              onValueChange={(v) => setFilterBtId(v ?? "all")}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {businessTypes.map((bt) => (
                  <SelectItem key={bt.id} value={bt.id}>{bt.icon} {bt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {businessTypes
            .filter((bt) => filterBtId === "all" || bt.id === filterBtId)
            .map((bt) => {
              const btCats = filteredCats.filter((c) => c.business_type_id === bt.id);
              const isExpanded = expandedBt.has(bt.id);
              return (
                <div key={bt.id} className="rounded-lg border border-border overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedBt((prev) => { const n = new Set(prev); n.has(bt.id) ? n.delete(bt.id) : n.add(bt.id); return n; })}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="text-lg">{bt.icon}</span>
                      {bt.name}
                      <Badge variant="secondary" className="text-xs">{btCats.length}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); openCatCreate(bt.id); }}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Catégorie
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="divide-y divide-border">
                      {btCats.length === 0 && (
                        <p className="px-6 py-4 text-sm text-muted-foreground">Aucune catégorie.</p>
                      )}
                      {btCats.map((cat) => {
                        const catProds = products.filter((p) => p.category_template_id === cat.id);
                        const isCatExpanded = expandedCat.has(cat.id);
                        return (
                          <div key={cat.id}>
                            <div
                              className="flex items-center gap-2 px-4 py-2.5 bg-background cursor-pointer hover:bg-muted/20 transition-colors"
                              onClick={() => setExpandedCat((prev) => { const n = new Set(prev); n.has(cat.id) ? n.delete(cat.id) : n.add(cat.id); return n; })}
                            >
                              {isCatExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              <span className="font-medium text-sm flex-1">{cat.name}</span>
                              <Badge variant="secondary" className="text-[10px]">{catProds.length} produits</Badge>
                              {!cat.is_active && <Badge variant="outline" className="text-[10px]">Inactif</Badge>}
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon-sm" onClick={() => openCatEdit(cat)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setCatDeleteId(cat.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {isCatExpanded && (
                              <div className="px-8 py-2 space-y-1 bg-muted/10">
                                {catProds.map((prod) => (
                                  <div key={prod.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 transition-colors group">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium">{prod.name}</span>
                                      {prod.description && <span className="text-xs text-muted-foreground ml-2">{prod.description}</span>}
                                    </div>
                                    {prod.default_price != null && (
                                      <span className="text-xs font-medium shrink-0">{prod.default_price.toFixed(2)} €</span>
                                    )}
                                    {!prod.is_active && <Badge variant="outline" className="text-[10px]">Inactif</Badge>}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon-sm" onClick={() => openProdEdit(prod)}>
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setProdDeleteId(prod.id)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                <Button size="sm" variant="ghost" className="w-full text-muted-foreground" onClick={() => openProdCreate(cat.id)}>
                                  <Plus className="mr-1 h-3.5 w-3.5" />
                                  Ajouter un produit
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </TabsContent>

        {/* ── Tab 3: Bundles ── */}
        <TabsContent value="bundles" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={filterBtIdBundles}
              onValueChange={(v) => setFilterBtIdBundles(v ?? "all")}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {businessTypes.map((bt) => (
                  <SelectItem key={bt.id} value={bt.id}>{bt.icon} {bt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {businessTypes
            .filter((bt) => filterBtIdBundles === "all" || bt.id === filterBtIdBundles)
            .map((bt) => {
              const btBundles = filteredBundles.filter((b) => b.business_type_id === bt.id);
              return (
                <div key={bt.id} className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-lg">{bt.icon}</span>
                      {bt.name}
                      <Badge variant="secondary" className="text-xs">{btBundles.length}</Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openBundleCreate(bt.id)}>
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Formule
                    </Button>
                  </div>
                  <div className="divide-y divide-border">
                    {btBundles.length === 0 && (
                      <p className="px-6 py-4 text-sm text-muted-foreground">Aucune formule.</p>
                    )}
                    {btBundles.map((bundle) => {
                      const bundleSlots = slots.filter((s) => s.bundle_template_id === bundle.id);
                      return (
                        <div key={bundle.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{bundle.name}</span>
                              {bundle.default_price != null && (
                                <Badge variant="secondary" className="text-xs">{bundle.default_price.toFixed(2)} €</Badge>
                              )}
                              {!bundle.is_active && <Badge variant="outline" className="text-xs">Inactif</Badge>}
                            </div>
                            {bundle.description && <p className="text-xs text-muted-foreground mt-0.5">{bundle.description}</p>}
                            {bundleSlots.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {bundleSlots.map((s) => s.label).join(" + ")}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon-sm" onClick={() => openBundleEdit(bundle)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setBundleDeleteId(bundle.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </TabsContent>
      </Tabs>

      {/* ── Business Type Dialog ── */}
      <Dialog open={btOpen} onOpenChange={setBtOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{btForm.id ? "Modifier le type" : "Nouveau type de commerce"}</DialogTitle>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Icône</Label>
                <Input value={btForm.icon ?? ""} onChange={(e) => setBtForm((f) => ({ ...f, icon: e.target.value }))} placeholder="🍽️" />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input type="number" value={btForm.position ?? 0} onChange={(e) => setBtForm((f) => ({ ...f, position: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={btForm.name ?? ""} onChange={(e) => setBtForm((f) => ({ ...f, name: e.target.value }))} placeholder="Restaurant" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input value={btForm.slug ?? ""} onChange={(e) => setBtForm((f) => ({ ...f, slug: e.target.value }))} placeholder="restaurant" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={btForm.description ?? ""} onChange={(e) => setBtForm((f) => ({ ...f, description: e.target.value }))} placeholder="Restaurant, brasserie, bistrot" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={btForm.is_active ?? true} onCheckedChange={(v) => setBtForm((f) => ({ ...f, is_active: v }))} />
              <Label>Actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBtOpen(false)}>Annuler</Button>
            <Button onClick={saveBt} disabled={btSaving} style={{ backgroundColor: "var(--primary)" }} className="text-primary-foreground hover:opacity-90">
              {btSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Category Template Dialog ── */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{catForm.id ? "Modifier la catégorie" : "Nouvelle catégorie template"}</DialogTitle>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Type de commerce *</Label>
              <Select
                value={catForm.business_type_id ?? ""}
                onValueChange={(v) =>
                  setCatForm((f) => ({ ...f, business_type_id: v ?? undefined }))
                }
              >
                <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
                <SelectContent>
                  {businessTypes.map((bt) => <SelectItem key={bt.id} value={bt.id}>{bt.icon} {bt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input value={catForm.name ?? ""} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} placeholder="Entrées" />
              </div>
              <div className="space-y-1.5">
                <Label>Icône</Label>
                <Input value={catForm.icon ?? ""} onChange={(e) => setCatForm((f) => ({ ...f, icon: e.target.value }))} placeholder="🥗" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={catForm.description ?? ""} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={catForm.is_active ?? true} onCheckedChange={(v) => setCatForm((f) => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>Annuler</Button>
            <Button onClick={saveCat} disabled={catSaving} style={{ backgroundColor: "var(--primary)" }} className="text-primary-foreground hover:opacity-90">
              {catSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Product Template Dialog ── */}
      <Dialog open={prodOpen} onOpenChange={setProdOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{prodForm.id ? "Modifier le produit" : "Nouveau produit template"}</DialogTitle>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={prodForm.name ?? ""} onChange={(e) => setProdForm((f) => ({ ...f, name: e.target.value }))} placeholder="Salade verte" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={prodForm.description ?? ""} onChange={(e) => setProdForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prix par défaut (€)</Label>
                <Input type="number" min="0" step="0.5" value={prodForm.default_price ?? ""} onChange={(e) => setProdForm((f) => ({ ...f, default_price: parseFloat(e.target.value) || null }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input type="number" value={prodForm.position ?? 0} onChange={(e) => setProdForm((f) => ({ ...f, position: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Option label</Label>
              <Input value={prodForm.option_label ?? ""} onChange={(e) => setProdForm((f) => ({ ...f, option_label: e.target.value || null }))} placeholder="Cuisson ?" />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (séparés par des virgules)</Label>
              <Input value={prodForm.tagsStr ?? ""} onChange={(e) => setProdForm((f) => ({ ...f, tagsStr: e.target.value }))} placeholder="vegetarien, poisson" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={prodForm.is_active ?? true} onCheckedChange={(v) => setProdForm((f) => ({ ...f, is_active: v }))} />
              <Label>Actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProdOpen(false)}>Annuler</Button>
            <Button onClick={saveProd} disabled={prodSaving} style={{ backgroundColor: "var(--primary)" }} className="text-primary-foreground hover:opacity-90">
              {prodSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bundle Template Dialog ── */}
      <Dialog open={bundleOpen} onOpenChange={setBundleOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle>{bundleForm.id ? "Modifier la formule" : "Nouvelle formule template"}</DialogTitle>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label>Type de commerce *</Label>
              <Select
                value={bundleForm.business_type_id ?? ""}
                onValueChange={(v) =>
                  setBundleForm((f) => ({ ...f, business_type_id: v ?? undefined }))
                }
              >
                <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
                <SelectContent>
                  {businessTypes.map((bt) => <SelectItem key={bt.id} value={bt.id}>{bt.icon} {bt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={bundleForm.name ?? ""} onChange={(e) => setBundleForm((f) => ({ ...f, name: e.target.value }))} placeholder="Formule Midi" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={bundleForm.description ?? ""} onChange={(e) => setBundleForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prix (€)</Label>
                <Input type="number" min="0" step="0.5" value={bundleForm.default_price ?? ""} onChange={(e) => setBundleForm((f) => ({ ...f, default_price: parseFloat(e.target.value) || null }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input type="number" value={bundleForm.position ?? 0} onChange={(e) => setBundleForm((f) => ({ ...f, position: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            {/* Slots */}
            <div className="space-y-2">
              <Label>Choix par catégorie template</Label>
              <p className="text-xs text-muted-foreground">
                L’intitulé enregistré pour chaque slot est le nom de la catégorie choisie.
              </p>
              {bundleSlotForms.map((slot, i) => (
                <div key={i} className="flex gap-2">
                  <Select
                    value={slot.category_template_id || "none"}
                    onValueChange={(v) =>
                      setBundleSlotForms((prev) =>
                        prev.map((s, idx) =>
                          idx === i
                            ? {
                                ...s,
                                category_template_id:
                                  v === "none" || v == null ? "" : v,
                              }
                            : s
                        )
                      )
                    }
                  >
                    <SelectTrigger className="min-w-0 flex-1">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— aucune —</SelectItem>
                      {categories
                        .filter((c) => !bundleForm.business_type_id || c.business_type_id === bundleForm.business_type_id)
                        .map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon-sm" onClick={() => setBundleSlotForms((prev) => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setBundleSlotForms((prev) => [...prev, { category_template_id: "" }])}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Ajouter un slot
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={bundleForm.is_active ?? true} onCheckedChange={(v) => setBundleForm((f) => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBundleOpen(false)}>Annuler</Button>
            <Button onClick={saveBundle} disabled={bundleSaving} style={{ backgroundColor: "var(--primary)" }} className="text-primary-foreground hover:opacity-90">
              {bundleSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmations ── */}
      <Dialog open={!!btDeleteId} onOpenChange={() => setBtDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Supprimer ce type ?</DialogTitle>
          <DialogDescription>Cette action supprimera aussi toutes les catégories et produits liés.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBtDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => btDeleteId && deleteBt(btDeleteId)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!catDeleteId} onOpenChange={() => setCatDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Supprimer cette catégorie ?</DialogTitle>
          <DialogDescription>Les produits de cette catégorie seront aussi supprimés.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => catDeleteId && deleteCat(catDeleteId)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!prodDeleteId} onOpenChange={() => setProdDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Supprimer ce produit ?</DialogTitle>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProdDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => prodDeleteId && deleteProd(prodDeleteId)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!bundleDeleteId} onOpenChange={() => setBundleDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Supprimer cette formule ?</DialogTitle>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBundleDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => bundleDeleteId && deleteBundle(bundleDeleteId)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
