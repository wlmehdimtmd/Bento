"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/product/ImageUploader";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { ReviewsSettings } from "./ReviewsSettings";
import { StorefrontPhotosManager } from "./StorefrontPhotosManager";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { SHOP_DESCRIPTION_MAX_CHARS } from "@/lib/constants";
import {
  emptyOpeningHoursDoc,
  hasPhysicalFulfillment,
  isDeliveryOnlyShop,
  parseShopOpeningHours,
  shopOpeningHoursDocSchema,
  type ShopOpeningHoursDoc,
} from "@/lib/openingHours";
import { slugify, cn } from "@/lib/utils";
import type { ShopReviews, SocialLinks } from "@/lib/types";
import { seedEnglishText } from "@/lib/translationSeed";
import { useLocale } from "@/components/i18n/LocaleProvider";

import { OpeningHoursSection } from "./OpeningHoursSection";
import { updateShopProfileAdmin } from "@/app/admin/actions";

// ─── Schema ───────────────────────────────────────────────────
const shopSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .regex(/^[a-z0-9-]+$/, "Slug invalide (lettres minuscules, chiffres, tirets)"),
  description: z
    .string()
    .optional()
    .refine(
      (v) => {
        if (!v) return true;
        return v.length <= SHOP_DESCRIPTION_MAX_CHARS;
      },
      { message: `Maximum ${SHOP_DESCRIPTION_MAX_CHARS} caractères dans la carte vitrine.` }
    ),
  address: z.string().optional(),
  phone: z.string().optional(),
  email_contact: z
    .string()
    .optional()
    .refine((v) => !v || v === "" || z.string().email().safeParse(v).success, {
      message: "Email invalide",
    }),
  google_maps_url: z.string().optional(),
  fulfillment_modes: z
    .array(z.string())
    .min(1, "Sélectionnez au moins un mode de service"),
});

type ShopFormValues = z.infer<typeof shopSchema>;

// ─── Types ────────────────────────────────────────────────────
interface ShopData {
  id: string;
  name: string;
  slug: string;
  type?: string;
  description?: string | null;
  name_fr?: string | null;
  name_en?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  address?: string | null;
  phone?: string | null;
  email_contact?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  social_links?: SocialLinks | Record<string, unknown>;
  fulfillment_modes?: string[];
  opening_hours?: unknown;
  opening_timezone?: string;
  open_on_public_holidays?: boolean;
}

interface ShopFormProps {
  userId: string;
  initialData?: ShopData;
  /** Soumission via server action admin (service role), sans RLS propriétaire. */
  submitAsAdmin?: boolean;
  /** Redirection après succès en mode admin (défaut : page settings admin de la boutique). */
  adminRedirectPath?: string;
  /** Mise en page à onglets (configuration vitrine dashboard / admin). */
  vitrineTabbed?: boolean;
  shopId?: string;
  storeUrl?: string;
  initialReviews?: ShopReviews | null;
  reviewsMutateApiBase?: string;
}

const FULFILLMENT_OPTIONS = [
  { value: "dine_in", label: "Sur place" },
  { value: "takeaway", label: "À emporter" },
  { value: "delivery", label: "Livraison" },
];

// ─── Component ───────────────────────────────────────────────
function readShowContactOnStorefront(links: ShopData["social_links"] | undefined): boolean {
  if (!links || typeof links !== "object") return true;
  return (links as SocialLinks).show_contact_on_storefront !== false;
}

export function ShopForm({
  userId,
  initialData,
  submitAsAdmin = false,
  adminRedirectPath,
  vitrineTabbed = false,
  shopId,
  storeUrl,
  initialReviews = null,
  reviewsMutateApiBase = "/api/reviews",
}: ShopFormProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.logo_url ?? null);
  const [coverUrl, setCoverUrl] = useState<string | null>(initialData?.cover_image_url ?? null);
  const [slugEdited, setSlugEdited] = useState(false);

  const [openingHoursDoc, setOpeningHoursDoc] = useState<ShopOpeningHoursDoc>(() => {
    const parsed =
      initialData?.opening_hours != null
        ? parseShopOpeningHours(initialData.opening_hours)
        : null;
    return parsed ?? emptyOpeningHoursDoc();
  });
  const [openOnPublicHolidays, setOpenOnPublicHolidays] = useState(
    initialData?.open_on_public_holidays ?? false
  );
  const [showContactOnStorefront, setShowContactOnStorefront] = useState(() =>
    readShowContactOnStorefront(initialData?.social_links)
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      description: initialData?.description ?? "",
      address: initialData?.address ?? "",
      phone: initialData?.phone ?? "",
      email_contact: initialData?.email_contact ?? "",
      google_maps_url:
        (initialData?.social_links as SocialLinks | undefined)?.google_maps_url ?? "",
      fulfillment_modes: (initialData?.fulfillment_modes as string[]) ?? ["takeaway"],
    },
  });

  const nameValue = watch("name");
  const fulfillmentModes = watch("fulfillment_modes") ?? [];
  const descriptionValue = watch("description") ?? "";

  useEffect(() => {
    if (!slugEdited && nameValue) {
      setValue("slug", slugify(nameValue), { shouldValidate: false });
    }
  }, [nameValue, slugEdited, setValue]);

  const toggleMode = (mode: string, checked: boolean) => {
    const updated = checked
      ? [...fulfillmentModes, mode]
      : fulfillmentModes.filter((m) => m !== mode);
    setValue("fulfillment_modes", updated, { shouldValidate: true });
  };

  async function onSubmit(values: ShopFormValues) {
    const supabase = createClient();

    const modes = values.fulfillment_modes;
    const showOpeningHours = hasPhysicalFulfillment(modes) && !isDeliveryOnlyShop(modes);

    let openingHoursPayload: Json | null = null;
    if (showOpeningHours) {
      const parsedHours = shopOpeningHoursDocSchema.safeParse(openingHoursDoc);
      if (!parsedHours.success) {
        toast.error(tr("Vérifiez les horaires (créneaux invalides).", "Check opening hours (invalid slots)."));
        return;
      }
      openingHoursPayload = parsedHours.data as Json;
    }

    const existingLinks = (initialData?.social_links ?? {}) as Record<string, unknown>;
    const newLinks: Record<string, unknown> = {
      ...existingLinks,
      google_maps_url: values.google_maps_url || undefined,
      show_contact_on_storefront: showContactOnStorefront,
    };

    if (submitAsAdmin) {
      if (!isEdit || !initialData?.id) {
        toast.error(tr("Création de boutique via l’admin n’est pas prise en charge ici.", "Shop creation via admin is not supported here."));
        return;
      }
      try {
        await updateShopProfileAdmin(initialData.id, {
          name: values.name,
          slug: values.slug,
          type: initialData?.type ?? "other",
          description: values.description || null,
          address: values.address || null,
          phone: values.phone || null,
          email_contact: values.email_contact || null,
          logo_url: logoUrl,
          cover_image_url: coverUrl,
          social_links: newLinks as unknown as Json,
          fulfillment_modes: values.fulfillment_modes as Json,
          opening_hours: showOpeningHours ? openingHoursPayload : null,
          opening_timezone: "Europe/Paris",
          open_on_public_holidays: showOpeningHours ? openOnPublicHolidays : false,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur";
        if (msg === "SLUG_DUPLICATE") {
          toast.error(tr("Ce slug est déjà utilisé. Choisissez-en un autre.", "This slug is already used. Choose another one."));
        } else {
          toast.error(msg);
        }
        return;
      }
      toast.success(tr("Boutique mise à jour !", "Shop updated!"));
      router.push(adminRedirectPath ?? `/admin/shops/${initialData.id}/settings`);
      router.refresh();
      return;
    }

    const payload = {
      owner_id: userId,
      name: values.name,
      name_fr: values.name,
      name_en: initialData?.name_en ?? seedEnglishText(values.name),
      slug: values.slug,
      type: initialData?.type ?? "other",
      description: values.description || null,
      description_fr: values.description || null,
      description_en: initialData?.description_en ?? seedEnglishText(values.description),
      address: values.address || null,
      phone: values.phone || null,
      email_contact: values.email_contact || null,
      logo_url: logoUrl,
      cover_image_url: coverUrl,
      social_links: newLinks as unknown as Json,
      fulfillment_modes: values.fulfillment_modes,
      is_active: true,
      opening_hours: showOpeningHours ? openingHoursPayload : null,
      opening_timezone: "Europe/Paris",
      open_on_public_holidays: showOpeningHours ? openOnPublicHolidays : false,
    };

    let error;

    if (isEdit) {
      ({ error } = await supabase
        .from("shops")
        .update(payload)
        .eq("id", initialData!.id));
    } else {
      ({ error } = await supabase.from("shops").insert(payload));
    }

    if (error) {
      if (error.code === "23505") {
        toast.error(tr("Ce slug est déjà utilisé. Choisissez-en un autre.", "This slug is already used. Choose another one."));
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success(isEdit ? tr("Boutique mise à jour !", "Shop updated!") : tr("Boutique créée !", "Shop created!"));
    router.push("/dashboard");
    router.refresh();
  }

  const tabbed = Boolean(vitrineTabbed && isEdit && shopId && storeUrl);

  const sectionChrome = (title: string) =>
    !tabbed ? (
      <>
        <h2 className="text-lg font-semibold">{title}</h2>
        <Separator />
      </>
    ) : null;

  const identitySection = (
    <div className="space-y-4">
      {sectionChrome(tr("Identité", "Identity"))}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">{tr("Nom de la boutique", "Shop name")} *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder={tr("La Bonne Table", "The Good Table")}
            disabled={isSubmitting}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">
            Slug URL * <span className="text-xs font-normal text-muted-foreground">({tr("auto-généré", "auto-generated")})</span>
          </Label>
          <Input
            id="slug"
            {...register("slug")}
            placeholder="la-bonne-table"
            disabled={isSubmitting}
            className="font-mono text-sm"
            onChange={(e) => {
              setSlugEdited(true);
              setValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""), {
                shouldValidate: true,
              });
            }}
          />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <span className="text-xs text-muted-foreground">
            {descriptionValue.length} / {SHOP_DESCRIPTION_MAX_CHARS}
          </span>
        </div>
        <Textarea
          id="description"
          {...register("description", {
            onChange: (e) => {
              const value = e.target.value;
              if (value.length > SHOP_DESCRIPTION_MAX_CHARS) {
                const clamped = value.slice(0, SHOP_DESCRIPTION_MAX_CHARS);
                e.target.value = clamped;
                setValue("description", clamped);
              }
            },
          })}
          placeholder="Décrivez votre établissement en quelques mots…"
          rows={4}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Maximum {SHOP_DESCRIPTION_MAX_CHARS} caractères dans la carte vitrine.
        </p>
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>
    </div>
  );

  const imagesSection = (
    <div className="space-y-4">
      {sectionChrome(tr("Images", "Images"))}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px] md:items-end">
        <ImageUploader
          bucket="shop-assets"
          label="Logo"
          hint="Format carré"
          currentUrl={logoUrl}
          square
          onUpload={setLogoUrl}
          onRemove={() => setLogoUrl(null)}
        />
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Prévisualisation logo</p>
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Aperçu logo de la vitrine"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl">🍱</span>
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploader
          bucket="shop-assets"
          label="Photo de couverture"
          currentUrl={coverUrl}
          onUpload={setCoverUrl}
          onRemove={() => setCoverUrl(null)}
        />
      </div>
    </div>
  );

  const contactSection = (
    <div className="space-y-4">
      {sectionChrome(tr("Contact & Localisation", "Contact & Location"))}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor="show-contact-storefront" className="text-base">
            {tr("Afficher dans la vitrine", "Show on storefront")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {tr("Téléphone, email et accès itinéraire sur la carte « Infos » de votre vitrine publique.", "Phone, email and directions on the Info card of your public storefront.")}
          </p>
        </div>
        <Switch
          id="show-contact-storefront"
          checked={showContactOnStorefront}
          onCheckedChange={setShowContactOnStorefront}
          disabled={isSubmitting}
          aria-label={tr("Afficher le contact sur la vitrine", "Show contact on storefront")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          {...register("address")}
          placeholder="12 rue de la Paix, 75001 Paris"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            {...register("phone")}
            type="tel"
            placeholder="+33 6 00 00 00 00"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email_contact">Email de contact</Label>
          <Input
            id="email_contact"
            {...register("email_contact")}
            type="email"
            placeholder="contact@labonnetable.fr"
            disabled={isSubmitting}
          />
          {errors.email_contact && (
            <p className="text-xs text-destructive">{errors.email_contact.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="google_maps_url" className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          {tr("Lien Google Avis", "Google reviews link")}
        </Label>
        <Input
          id="google_maps_url"
          {...register("google_maps_url")}
          placeholder="Ex : https://maps.google.com/..."
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Copiez le lien de votre fiche Google Maps pour afficher vos avis.
        </p>
      </div>
    </div>
  );

  const fulfillmentFields = (
    <>
      <div className="flex flex-wrap gap-4">
        {FULFILLMENT_OPTIONS.map(({ value, label }) => (
          <label key={value} className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={fulfillmentModes.includes(value)}
              onCheckedChange={(checked) => toggleMode(value, !!checked)}
              disabled={isSubmitting}
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
      {errors.fulfillment_modes && (
        <p className="text-xs text-destructive">{errors.fulfillment_modes.message}</p>
      )}
    </>
  );

  const fulfillmentSection = (
    <div className="space-y-4">
      {sectionChrome(tr("Modes de service", "Service modes") + " *")}
      {fulfillmentFields}
    </div>
  );

  const openingHoursBlock = (
    <OpeningHoursSection
      fulfillmentModes={fulfillmentModes}
      value={openingHoursDoc}
      onChange={setOpeningHoursDoc}
      openOnPublicHolidays={openOnPublicHolidays}
      onOpenOnPublicHolidaysChange={setOpenOnPublicHolidays}
      disabled={isSubmitting}
      omitSectionTitle={tabbed}
    />
  );

  const submitButton = (
    <Button
      type="submit"
      disabled={isSubmitting}
      style={{ backgroundColor: "var(--primary)" }}
      className="text-primary-foreground hover:opacity-90 w-full sm:w-auto"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {tr("Enregistrement…", "Saving...")}
        </>
      ) : isEdit ? (
        tr("Mettre à jour la boutique", "Update shop")
      ) : (
        tr("Créer la boutique", "Create shop")
      )}
    </Button>
  );

  if (tabbed) {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-w-3xl flex-col gap-4 pb-4"
      >
        <Tabs defaultValue="identite" className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <TabsList
              variant="segmented"
              className="inline-flex h-11 min-h-11 w-max min-w-full max-w-none flex-nowrap items-stretch justify-start gap-1 sm:w-full sm:justify-between"
            >
              <TabsTrigger value="identite" className="h-full shrink-0 grow-0 basis-auto whitespace-nowrap sm:flex-1">
                Identité
              </TabsTrigger>
              <TabsTrigger value="images" className="h-full shrink-0 grow-0 basis-auto whitespace-nowrap sm:flex-1">
                Image
              </TabsTrigger>
              <TabsTrigger value="photos" className="h-full shrink-0 grow-0 basis-auto whitespace-nowrap sm:flex-1">
                Photos
              </TabsTrigger>
              <TabsTrigger value="contact" className="h-full shrink-0 grow-0 basis-auto whitespace-nowrap sm:flex-1">
                Contact
              </TabsTrigger>
              <TabsTrigger value="horaires" className="h-full shrink-0 grow-0 basis-auto whitespace-nowrap sm:flex-1">
                Horaires
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="identite" keepMounted className="min-h-0 flex-1 pt-1 outline-none">
            <div className="space-y-6">
              {identitySection}
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Modes de service *</p>
                {fulfillmentFields}
              </div>
              <Separator />
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">QR code</p>
                <p className="text-sm text-muted-foreground">
                  Scannez ce code pour ouvrir directement votre vitrine publique.
                </p>
                <div className="flex justify-center rounded-lg border border-border bg-card p-6">
                  <QRCodeDisplay url={storeUrl!} shopName={initialData?.slug} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" keepMounted className="min-h-0 flex-1 pt-1 outline-none">
            {imagesSection}
          </TabsContent>

          <TabsContent value="photos" keepMounted className="min-h-0 flex-1 pt-1 outline-none">
            <StorefrontPhotosManager shopId={shopId!} />
          </TabsContent>

          <TabsContent value="contact" keepMounted className="min-h-0 flex-1 pt-1 outline-none">
            <div className="space-y-8">
              {contactSection}
              <Separator />
              <ReviewsSettings
                shopId={shopId!}
                initialReviews={initialReviews}
                reviewsMutateApiBase={reviewsMutateApiBase}
                omitOuterChrome
              />
            </div>
          </TabsContent>

          <TabsContent value="horaires" keepMounted className="min-h-0 flex-1 pt-1 outline-none">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ce sont les{" "}
                <span className="font-medium text-foreground">horaires d&apos;ouverture de la vitrine</span>{" "}
                (carte « Infos », statut ouvert / fermé) pour les services{" "}
                <span className="font-medium text-foreground">sur place</span> et{" "}
                <span className="font-medium text-foreground">à emporter</span> : ils indiquent quand la boutique
                accueille en salle ou prépare les retraits. Si vous êtes uniquement en livraison, ce planning
                magasin ne s&apos;affiche pas sur la vitrine.
              </p>
              {openingHoursBlock}
            </div>
          </TabsContent>
        </Tabs>

        <div
          className={cn(
            "sticky bottom-0 z-10 -mx-1 mt-2 border-t border-border px-1 pt-4"
          )}
        >
          {submitButton}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-8">
      <section className="space-y-4">{identitySection}</section>
      <section className="space-y-4">{imagesSection}</section>
      <section className="space-y-4">{contactSection}</section>
      <section className="space-y-4">{fulfillmentSection}</section>
      {openingHoursBlock}
      {submitButton}
    </form>
  );
}
