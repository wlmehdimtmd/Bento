"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/product/ImageUploader";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingStepTitle } from "@/components/onboarding/OnboardingStepTitle";
import { createClient } from "@/lib/supabase/client";
import { SHOP_DESCRIPTION_MAX_CHARS } from "@/lib/constants";
import { cn, slugify } from "@/lib/utils";
import { mainStepIndex } from "@/lib/onboarding-flow";
import {
  useOnboardingRuntime,
  useOnboardingStepNav,
} from "@/components/onboarding/OnboardingRuntimeContext";

const FORM_ID = "onboarding-shop-form";

const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .regex(/^[a-z0-9-]+$/, "Slug invalide (lettres minuscules, chiffres, tirets)"),
  description: z
    .string()
    .max(
      SHOP_DESCRIPTION_MAX_CHARS,
      `Maximum ${SHOP_DESCRIPTION_MAX_CHARS} caractères dans la description.`
    )
    .optional(),
  address: z.string(),
  phone: z.string(),
  email_contact: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "Email invalide",
    }),
  google_maps_url: z.string().optional(),
  fulfillment_modes: z
    .array(z.string())
    .min(1, "Sélectionnez au moins un mode de service"),
});

type FormValues = z.infer<typeof schema>;

interface InitialData {
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email_contact?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  google_maps_url?: string;
  social_links?: Record<string, unknown>;
  fulfillment_modes?: string[];
}

const FULFILLMENT_OPTIONS = [
  { value: "dine_in", label: "Sur place" },
  { value: "takeaway", label: "À emporter" },
  { value: "delivery", label: "Livraison" },
];

// Fields to validate per sub-step
const SUB_STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  1: ["name", "slug"],
  2: [],
  3: ["email_contact"],
  4: ["fulfillment_modes"],
};

export function OnboardingShopStep({
  shopId,
  initialData,
  initialSubStep = 1,
}: {
  shopId: string;
  initialData: InitialData;
  initialSubStep?: number;
}) {
  const { mode } = useOnboardingRuntime();
  const goStep = useOnboardingStepNav(shopId);
  const isPreview = mode === "preview";
  const [subStep, setSubStep] = useState(initialSubStep);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData.logo_url ?? null);
  const [coverUrl, setCoverUrl] = useState<string | null>(initialData.cover_image_url ?? null);
  const [slugEdited, setSlugEdited] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData.name,
      slug: initialData.slug,
      description: initialData.description ?? "",
      address: initialData.address ?? "",
      phone: initialData.phone ?? "",
      email_contact: initialData.email_contact ?? "",
      google_maps_url: initialData.google_maps_url ?? "",
      fulfillment_modes: initialData.fulfillment_modes?.length
        ? initialData.fulfillment_modes
        : ["takeaway"],
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

  async function handleNext() {
    if (subStep >= 4) return;
    const fields = SUB_STEP_FIELDS[subStep];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setSubStep((s) => (s >= 4 ? 4 : s + 1));
  }

  async function onSubmit(values: FormValues) {
    if (isPreview) {
      goStep("catalog");
      return;
    }

    const supabase = createClient();

    const existingLinks = initialData.social_links ?? {};
    const newLinks = {
      ...existingLinks,
      google_maps_url: values.google_maps_url || undefined,
      _ob_vitrine: 1,
    };

    const { error } = await supabase
      .from("shops")
      .update({
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        address: values.address.trim() || null,
        phone: values.phone.trim() || null,
        email_contact: values.email_contact || null,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
        social_links: newLinks,
        fulfillment_modes: values.fulfillment_modes,
      })
      .eq("id", shopId);

    if (error) {
      if (error.code === "23505") {
        toast.error("Ce slug est déjà utilisé. Choisissez-en un autre.");
        setSubStep(1);
      } else {
        toast.error(error.message);
      }
      return;
    }

    goStep("catalog");
  }

  // ── Sub-step 1: L'essentiel ──────────────────────────────────
  const step1Content = (
    <div className="space-y-6 pt-2">
      <OnboardingStepTitle
        title="Ma nouvelle vitrine"
        subtitle="Donnez un nom à votre vitrine en ligne et personnalisez l’URL."
      />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Nom de la vitrine <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="La Bonne Table"
            disabled={isSubmitting}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">
            Slug URL{" "}
            <span className="text-xs font-normal text-muted-foreground">(auto-généré)</span>
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
            placeholder="Ce que vos clients doivent savoir en arrivant sur votre vitrine"
            rows={4}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Maximum {SHOP_DESCRIPTION_MAX_CHARS} caractères affichés dans la carte.
          </p>
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px] md:items-end">
          <ImageUploader
            bucket="shop-assets"
            label="Logo"
            hint="Format carré"
            currentUrl={logoUrl}
            square
            onUpload={setLogoUrl}
            onRemove={() => setLogoUrl(null)}
            simulationDisabled={isPreview}
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
      </div>
    </div>
  );

  // ── Sub-step 2: Ma vitrine ───────────────────────────────────
  const step2Content = (
    <div className="space-y-6 pt-2">
      <OnboardingStepTitle
        title="Ma vitrine en ligne"
        subtitle="Ces visuels apparaissent sur votre page publique : soignez la première impression."
      />

      <div className="space-y-4">
        <ImageUploader
          bucket="shop-assets"
          label="Photo de couverture"
          currentUrl={coverUrl}
          onUpload={setCoverUrl}
          onRemove={() => setCoverUrl(null)}
          simulationDisabled={isPreview}
        />
      </div>
    </div>
  );

  // ── Sub-step 3: Mes coordonnées ──────────────────────────────
  /** Entrée dans un champ + Entrée doit avancer comme « Suivant », sans soumettre autre chose. */
  const step3Content = (
    <form
      className="space-y-6 pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        void handleNext();
      }}
    >
      <OnboardingStepTitle
        title="Mes coordonnées"
        subtitle="Adresse et téléphone sont facultatifs. Renseignez-les si vous souhaitez les afficher sur votre vitrine."
      />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            {...register("address")}
            placeholder="12 rue de la Paix, 75001 Paris"
            disabled={isSubmitting}
          />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            {...register("phone")}
            type="tel"
            placeholder="+33 6 00 00 00 00"
            disabled={isSubmitting}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
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

        <div className="space-y-1.5">
          <Label htmlFor="google_maps_url">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Lien Google Maps
            </span>
          </Label>
          <Input
            id="google_maps_url"
            {...register("google_maps_url")}
            placeholder="https://maps.google.com/..."
            disabled={isSubmitting}
          />
        </div>
      </div>
    </form>
  );

  // ── Sub-step 4: Modes de service (après coordonnées, avant le catalogue) ──
  const step4Content = (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
      <OnboardingStepTitle
        title={
          <>
            Modes de service <span className="text-destructive">*</span>
          </>
        }
        subtitle="Comment vos clients peuvent-ils commander sur votre vitrine ?"
      />

      <div className="space-y-3">
        {FULFILLMENT_OPTIONS.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-3 cursor-pointer rounded-xl border border-border p-4 hover:bg-muted/40 transition-colors">
            <Checkbox
              checked={fulfillmentModes.includes(value)}
              onCheckedChange={(checked) => toggleMode(value, !!checked)}
              disabled={isSubmitting}
            />
            <span className="text-sm font-medium">{label}</span>
          </label>
        ))}
        {errors.fulfillment_modes && (
          <p className="text-xs text-destructive">{errors.fulfillment_modes.message}</p>
        )}
      </div>
    </form>
  );

  const contentByStep: Record<number, React.ReactNode> = {
    1: step1Content,
    2: step2Content,
    3: step3Content,
    4: step4Content,
  };

  const isLastSubStep = subStep === 4;

  const footer = (
    <div
      className={cn(
        "flex gap-2 items-stretch",
        subStep > 1 ? "sm:justify-between" : ""
      )}
    >
      {subStep > 1 ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setSubStep((s) => s - 1)}
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </Button>
      ) : null}
      {isLastSubStep ? (
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleSubmit(onSubmit)()}
          style={{ backgroundColor: "var(--color-bento-accent)" }}
          className={cn(
            "text-white hover:opacity-90 gap-1.5",
            subStep > 1 ? "flex-1 sm:flex-initial" : "w-full"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            <>
              Suivant
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={() => void handleNext()}
          style={{ backgroundColor: "var(--color-bento-accent)" }}
          className={cn(
            "text-white hover:opacity-90 gap-1.5",
            subStep > 1 ? "flex-1 sm:flex-initial" : "w-full"
          )}
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <OnboardingShell
      currentStep={mainStepIndex("shop")}
      subSteps={{ total: 5, current: subStep }}
      footer={footer}
    >
      {contentByStep[subStep]}
    </OnboardingShell>
  );
}
