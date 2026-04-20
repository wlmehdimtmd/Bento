"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CreditCard, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/stores/cartStore";
import { usePublicShop } from "@/components/shop/PublicShopContext";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

// ── Fulfillment labels ─────────────────────────────────────────

const FULFILLMENT_LABELS: Record<string, string> = {
  dine_in: "Sur place",
  takeaway: "À emporter",
  delivery: "Livraison",
};

// ── Schema ─────────────────────────────────────────────────────

const checkoutSchema = z
  .object({
    fulfillment_mode: z.string().min(1, "Mode de retrait requis"),
    customer_name: z.string().min(2, "Nom requis (minimum 2 caractères)"),
    customer_phone: z.string().optional(),
    table_number: z.string().optional(),
    delivery_address: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment_mode === "dine_in" && !data.table_number?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["table_number"],
        message: "N° de table requis pour le service sur place",
      });
    }
    if (data.fulfillment_mode === "delivery" && !data.delivery_address?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["delivery_address"],
        message: "Adresse requise pour la livraison",
      });
    }
  });

type CheckoutValues = z.infer<typeof checkoutSchema>;

// ── Component ──────────────────────────────────────────────────

interface CheckoutFormProps {
  onBack: () => void;
}

export function CheckoutForm({ onBack }: CheckoutFormProps) {
  const shop = usePublicShop();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());
  const count = useCartStore((s) => s.getCount());

  const fulfillmentModes = shop.fulfillmentModes.filter(
    (m) => m in FULFILLMENT_LABELS
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fulfillment_mode: fulfillmentModes[0] ?? "",
    },
  });

  const fulfillmentMode = watch("fulfillment_mode");

  async function onSubmit(values: CheckoutValues) {
    if (shop.isDemoMode) {
      toast.info("Mode démo — Dans la vraie version, votre commande serait transmise ici. Créez votre vitrine pour tester avec de vraies commandes !");
      return;
    }

    const supabase = createClient();

    // 1. Create order in Supabase
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        shop_id: shop.id,
        customer_name: values.customer_name,
        customer_phone: values.customer_phone || null,
        fulfillment_mode: values.fulfillment_mode,
        table_number: values.table_number || null,
        delivery_address: values.delivery_address || null,
        notes: values.notes || null,
        status: "pending",
        total_amount: total,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      toast.error("Erreur lors de la création de la commande.");
      return;
    }

    // 2. Create order_items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.isBundle ? null : item.productId,
      bundle_id: item.isBundle ? item.bundleId ?? null : null,
      quantity: item.quantity,
      unit_price: item.price,
      option_value: item.optionValue ?? null,
      special_note: item.specialNote ?? null,
    }));

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsErr) {
      toast.error("Erreur lors de l'enregistrement des articles.");
      // Clean up the order
      await supabase.from("orders").delete().eq("id", order.id);
      return;
    }

    // 3. Create Stripe Checkout session (montants recalculés côté serveur depuis la commande)
    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(
        (body as { error?: string }).error ?? "Erreur lors du paiement."
      );
      return;
    }

    const { url } = (await res.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col h-full"
    >
      {/* Header back */}
      <div className="flex items-center gap-2 pb-3 border-b border-border mb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">Informations de commande</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
        {/* Fulfillment mode */}
        <div className="space-y-2">
          <Label>Mode de retrait *</Label>
          <div className="grid gap-2">
            {fulfillmentModes.map((mode) => (
              <label
                key={mode}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                  fulfillmentMode === mode
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <input
                  type="radio"
                  {...register("fulfillment_mode")}
                  value={mode}
                  onChange={() =>
                    setValue("fulfillment_mode", mode, { shouldValidate: true })
                  }
                  className="accent-[var(--primary)]"
                />
                <span className="text-sm font-medium">
                  {FULFILLMENT_LABELS[mode]}
                </span>
              </label>
            ))}
          </div>
          {errors.fulfillment_mode && (
            <p className="text-xs text-destructive">
              {errors.fulfillment_mode.message}
            </p>
          )}
        </div>

        <Separator />

        {/* Customer name */}
        <div className="space-y-1.5">
          <Label htmlFor="customer_name">Nom *</Label>
          <Input
            id="customer_name"
            {...register("customer_name")}
            placeholder="Votre nom"
            disabled={isSubmitting}
          />
          {errors.customer_name && (
            <p className="text-xs text-destructive">
              {errors.customer_name.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="customer_phone">Téléphone</Label>
          <Input
            id="customer_phone"
            type="tel"
            {...register("customer_phone")}
            placeholder="+33 6 00 00 00 00"
            disabled={isSubmitting}
          />
        </div>

        {/* Table number (dine_in only) */}
        {fulfillmentMode === "dine_in" && (
          <div className="space-y-1.5">
            <Label htmlFor="table_number">N° de table *</Label>
            <Input
              id="table_number"
              {...register("table_number")}
              placeholder="Ex : 12"
              disabled={isSubmitting}
            />
            {errors.table_number && (
              <p className="text-xs text-destructive">
                {errors.table_number.message}
              </p>
            )}
          </div>
        )}

        {/* Delivery address (delivery only) */}
        {fulfillmentMode === "delivery" && (
          <div className="space-y-1.5">
            <Label htmlFor="delivery_address">Adresse de livraison *</Label>
            <Input
              id="delivery_address"
              {...register("delivery_address")}
              placeholder="12 rue des Lilas, 75001 Paris"
              disabled={isSubmitting}
            />
            {errors.delivery_address && (
              <p className="text-xs text-destructive">
                {errors.delivery_address.message}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Instructions spéciales pour votre commande…"
            rows={2}
            disabled={isSubmitting}
          />
        </div>

        <Separator />

        {/* Order recap (read-only) */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Récapitulatif ({count} article{count > 1 ? "s" : ""})
          </p>
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.quantity}× {item.name}
                  {item.optionValue && (
                    <span className="text-xs"> — {item.optionValue}</span>
                  )}
                </span>
                <span className="tabular-nums font-medium">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
            <span>Total</span>
            <span style={{ color: "var(--primary)" }}>
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4 mt-2 border-t border-border">
        <Button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="w-full font-semibold gap-2 hover:opacity-90"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirection vers Stripe…
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Payer {formatPrice(total)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
