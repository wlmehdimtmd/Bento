"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Mail, Pencil, Plus, Settings, Trash2 } from "lucide-react";

import { AppBrandMark } from "@/components/layout/AppBrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { BentoGrid } from "@/components/bento/BentoGrid";
import { BentoCard } from "@/components/bento/BentoCard";
import { BentoCardBack } from "@/components/bento/BentoCardBack";
import { BentoCardBackFloating } from "@/components/bento/BentoCardBackFloating";
import { BentoCardBundle } from "@/components/bento/BentoCardBundle";
import { BentoCardCategory } from "@/components/bento/BentoCardCategory";
import { BentoCardInfo } from "@/components/bento/BentoCardInfo";
import { BentoCardProduct } from "@/components/bento/BentoCardProduct";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { BentoGridSkeleton } from "@/components/ui/BentoSkeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ShopReviews } from "@/lib/types";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6 ring-1 ring-foreground/10">
      <header>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

const SELECT_ITEMS = { a: "Option A", b: "Option B", c: "Option C" } as const;

/** Images autorisées par `next.config.ts` (Unsplash). */
const DEMO_COVER =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";
const DEMO_LOGO =
  "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=128&q=80";
const DEMO_CATEGORY_COVER =
  "https://images.unsplash.com/photo-1579871494447-7f965a992fff?auto=format&fit=crop&w=800&q=80";
const DEMO_PRODUCT_IMG =
  "https://images.unsplash.com/photo-1617195737497-67a819abbac6?auto=format&fit=crop&w=600&q=80";

const DEMO_BUNDLE_SLOTS = [
  {
    label: "Entrée",
    quantity: 1,
    categoryName: "Entrées",
    categoryEmoji: "🥗",
  },
  {
    label: "Plat",
    quantity: 1,
    categoryName: "Plats",
    categoryEmoji: "🍜",
  },
  {
    label: "Boisson",
    quantity: 1,
    categoryName: "Boissons",
    categoryEmoji: "🍵",
  },
] as const;

export function DevUiClient() {
  const demoGoogleReviews = useMemo((): ShopReviews => {
    const t = new Date().toISOString();
    return {
      shop_id: "00000000-0000-4000-8000-000000000099",
      google_enabled: true,
      google_place_id: "ChIJdemo",
      google_place_name: "Bento Resto Démo",
      google_place_address: null,
      google_rating: 4.7,
      google_review_count: 214,
      google_url: "https://www.google.com/maps",
      google_last_fetched: t,
      tripadvisor_enabled: false,
      tripadvisor_url: null,
      tripadvisor_name: null,
      tripadvisor_rating: null,
      tripadvisor_review_count: null,
      tripadvisor_last_fetched: null,
      updated_at: t,
    };
  }, []);

  const [selectValue, setSelectValue] = useState<string>("a");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuRadio, setMenuRadio] = useState("one");
  const [menuShowStatus, setMenuShowStatus] = useState(true);
  const [plan, setPlan] = useState("starter");
  const [switchOn, setSwitchOn] = useState(true);
  const [switchSm, setSwitchSm] = useState(false);
  const [floatingBackOpen, setFloatingBackOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-heading text-base font-semibold">Playground UI</span>
            <span className="text-xs text-muted-foreground">
              Tokens et typo dans{" "}
              <code className="rounded bg-muted px-1 py-0.5">globals.css</code> — démos{" "}
              <code className="rounded bg-muted px-1 py-0.5">@/components/ui</code> et{" "}
              <code className="rounded bg-muted px-1 py-0.5">@/components/bento</code>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dev"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Hub dev
            </Link>
            <ThemeToggle />
            <Link
              href="/dev/da"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Charte / DA
            </Link>
            <Link
              href="/dev/onboarding"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Onboarding dev
            </Link>
          </div>
        </div>
      </div>

      <main
        id="main-content"
        className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6"
      >
        <Section
          title="Identité — marque"
          description="Composant AppBrandMark : même rendu que header public et cartes auth."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                variant=&quot;header&quot;
              </p>
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <AppBrandMark variant="header" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                variant=&quot;auth&quot;
              </p>
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
                <AppBrandMark variant="auth" className="inline-block" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Référence documentaire (CLAUDE.md) : fond clair type{" "}
            <code className="rounded bg-muted px-1">#faf9f6</code>, texte{" "}
            <code className="rounded bg-muted px-1">#1a1a1a</code>, accents{" "}
            <code className="rounded bg-muted px-1">#e85d04</code> /{" "}
            <code className="rounded bg-muted px-1">#f4a261</code> (sombre) — portés en CSS
            via <code className="rounded bg-muted px-1">--color-cream</code>,{" "}
            <code className="rounded bg-muted px-1">--color-bento-accent</code>, etc.
          </p>
        </Section>

        <Section
          title="Button"
          description="Variantes, tailles, états — même module que le reste de l’app."
        >
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Variantes
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tailles
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="xs">XS</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Icône">
                <Settings className="size-4" />
              </Button>
              <Button size="icon-sm" aria-label="Icône sm">
                <Pencil className="size-3.5" />
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button disabled>Désactivé</Button>
            <Button aria-invalid>aria-invalid</Button>
            <Button>
              <Mail data-icon="inline-start" className="size-4" />
              Avec icône
            </Button>
            <Button variant="outline" disabled>
              <Loader2 className="size-4 animate-spin" />
              Chargement
            </Button>
          </div>
        </Section>

        <Section
          title="Lien stylé (buttonVariants)"
          description="Même styles hover que les CTA auth / landing."
        >
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "default" }), "inline-flex")}
          >
            Lien comme bouton primary
          </Link>
        </Section>

        <Section title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="ghost">Ghost</Badge>
            <Badge variant="link">Link</Badge>
          </div>
        </Section>

        <Section
          title="Champs de formulaire"
          description="Label, Input, Textarea, Checkbox, Switch."
        >
          <div className="grid max-w-xl gap-6">
            <div className="grid gap-2">
              <Label htmlFor="dev-text">Texte</Label>
              <Input id="dev-text" placeholder="Placeholder" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dev-email">Email</Label>
              <Input id="dev-email" type="email" placeholder="vous@exemple.fr" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dev-password">Mot de passe</Label>
              <Input id="dev-password" type="password" placeholder="••••••••" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dev-number">Nombre</Label>
              <Input id="dev-number" type="number" min={0} defaultValue={12} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dev-readonly">Lecture seule</Label>
              <Input id="dev-readonly" readOnly defaultValue="Non modifiable" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dev-disabled">Désactivé</Label>
              <Input id="dev-disabled" disabled placeholder="Désactivé" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dev-invalid">Erreur (aria-invalid)</Label>
              <Input id="dev-invalid" aria-invalid placeholder="Champ invalide" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dev-textarea">Textarea</Label>
              <Textarea id="dev-textarea" placeholder="Description…" rows={3} />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="dev-cb" defaultChecked />
                <Label htmlFor="dev-cb">Case à cocher</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="dev-sw"
                  checked={switchOn}
                  onCheckedChange={setSwitchOn}
                />
                <Label htmlFor="dev-sw">Switch (default)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  size="sm"
                  id="dev-sw-sm"
                  checked={switchSm}
                  onCheckedChange={setSwitchSm}
                />
                <Label htmlFor="dev-sw-sm">Switch sm</Label>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Select">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="dev-select-trigger">Liste déroulante</Label>
            <Select
              value={selectValue}
              items={SELECT_ITEMS}
              onValueChange={(v) => {
                if (v) setSelectValue(v);
              }}
            >
              <SelectTrigger id="dev-select-trigger" className="w-full min-w-0">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
                <SelectItem value="c">Option C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section title="RadioGroup">
          <RadioGroup
            value={plan}
            onValueChange={setPlan}
            className="max-w-sm space-y-3"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="starter" id="plan-starter" />
              <Label htmlFor="plan-starter" className="font-normal">
                Starter
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="pro" id="plan-pro" />
              <Label htmlFor="plan-pro" className="font-normal">
                Pro
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="enterprise" id="plan-ent" />
              <Label htmlFor="plan-ent" className="font-normal">
                Enterprise
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">Valeur : {plan}</p>
        </Section>

        <Section title="Separator">
          <div className="space-y-2 text-sm">
            <span>Au-dessus</span>
            <Separator />
            <span>En dessous</span>
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="tab1" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="tab1">Compte</TabsTrigger>
              <TabsTrigger value="tab2">Paramètres</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="mt-3 rounded-lg border border-border bg-muted/30 p-4">
              Contenu de l’onglet Compte.
            </TabsContent>
            <TabsContent value="tab2" className="mt-3 rounded-lg border border-border bg-muted/30 p-4">
              Contenu de l’onglet Paramètres.
            </TabsContent>
          </Tabs>
          <Tabs defaultValue="a" className="mt-6 w-full max-w-md">
            <TabsList variant="line">
              <TabsTrigger value="a">Ligne A</TabsTrigger>
              <TabsTrigger value="b">Ligne B</TabsTrigger>
            </TabsList>
            <TabsContent value="a" className="mt-3 text-sm text-muted-foreground">
              Variante line sur la liste.
            </TabsContent>
            <TabsContent value="b" className="mt-3 text-sm text-muted-foreground">
              Deuxième panneau.
            </TabsContent>
          </Tabs>
        </Section>

        <Section title="Table">
          <Table>
            <TableCaption>Exemple de tableau (données fictives).</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="w-12 text-center">OK</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Miso</TableCell>
                <TableCell className="text-right">4,50 €</TableCell>
                <TableCell className="text-center">
                  <Checkbox aria-label="Sélection miso" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ramen</TableCell>
                <TableCell className="text-right">12,00 €</TableCell>
                <TableCell className="text-center">
                  <Checkbox defaultChecked aria-label="Sélection ramen" />
                </TableCell>
              </TableRow>
              <TableRow data-state="selected">
                <TableCell colSpan={3} className="text-muted-foreground">
                  Ligne avec hover / selected (data-state)
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Section>

        <Section title="Card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Carte standard</CardTitle>
                <CardDescription>Sous-titre ou description courte.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Contenu principal de la carte.
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm">Action</Button>
                <Button size="sm" variant="outline">
                  Annuler
                </Button>
              </CardFooter>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Petite carte</CardTitle>
                <CardDescription>size=&quot;sm&quot;</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Badge</Badge>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Avatar">
          <div className="flex flex-wrap items-end gap-6">
            <Avatar>
              <AvatarImage src="" alt="" />
              <AvatarFallback>BR</AvatarFallback>
            </Avatar>
            <Avatar size="sm">
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback>LG</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>+</AvatarFallback>
              <AvatarBadge>
                <Plus className="size-2" />
              </AvatarBadge>
            </Avatar>
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>B</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+3</AvatarGroupCount>
            </AvatarGroup>
          </div>
        </Section>

        <Section title="Skeleton & BentoGridSkeleton">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3 max-w-[200px]" />
                <Skeleton className="h-3 w-full max-w-[280px]" />
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="max-h-64 overflow-auto p-2">
                <BentoGridSkeleton />
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Bento — cartes vitrine"
          description={
            "Les cartes utilisent Framer Motion : les placer dans un BentoGrid " +
            "pour l’animation d’entrée (sinon elles restent en opacity: 0)."
          }
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Label htmlFor="dev-floating-back" className="text-muted-foreground">
              BentoCardBackFloating (aperçu mobile)
            </Label>
            <Switch
              id="dev-floating-back"
              checked={floatingBackOpen}
              onCheckedChange={setFloatingBackOpen}
            />
          </div>
          <BentoCardBackFloating
            open={floatingBackOpen}
            categoryName="Sushi"
            categoryEmoji="🍣"
            description="Exemple de barre de retour flottante"
            onBack={() => {
              setFloatingBackOpen(false);
              toast.message("Retour aux catégories (démo)");
            }}
          />

          <div className="mt-6 w-full overflow-x-auto rounded-xl border border-border p-3 sm:p-4">
            <BentoGrid className="w-full max-w-5xl">
              <BentoCardInfo
                shopName="Bento Resto Démo"
                shopSlug="demo-shop"
                description={
                  "Texte de présentation court pour la carte boutique. " +
                  "Même composant que sur la vitrine publique."
                }
                coverUrl={DEMO_COVER}
                logoUrl={DEMO_LOGO}
                address="12 rue du Commerce, 75000 Paris"
                phone="+33 1 23 45 67 89"
                emailContact="contact@bento-resto.demo"
                socialLinks={{
                  instagram: "https://instagram.com",
                  website: "https://example.com",
                  chef_name: "Marie Dupont",
                }}
                fulfillmentModes={["takeaway"]}
                reviews={demoGoogleReviews}
              />
              <BentoCardCategory
                name="Sans visuel"
                iconEmoji="🍱"
                productCount={8}
                onClick={() => toast.message("Catégorie (sans image)")}
              />
              <BentoCardCategory
                name="Avec photo"
                iconEmoji="🍣"
                productCount={12}
                coverImageUrl={DEMO_CATEGORY_COVER}
                onClick={() => toast.message("Catégorie (avec image)")}
              />
              <BentoCardProduct
                name="Ramen miso"
                price={12.5}
                imageUrl={DEMO_PRODUCT_IMG}
                tags={["vegan", "spicy"]}
                isAvailable
                onClick={() => toast.message("Fiche produit (démo)")}
                onAddToCart={(e) => {
                  e.stopPropagation();
                  toast.success("Ajout au panier (démo)");
                }}
              />
              <BentoCardProduct
                name="Plat indisponible"
                price={9}
                fallbackEmoji="🍛"
                isAvailable={false}
                onClick={() => {}}
                onAddToCart={() => {}}
              />
              <BentoCardBundle
                name="Menu midi"
                price={18.9}
                imageUrl={DEMO_PRODUCT_IMG}
                slots={[...DEMO_BUNDLE_SLOTS]}
                onClick={() => toast.message("Formule (démo)")}
              />
              <BentoCardBack
                categoryName="Sushi"
                categoryEmoji="🍣"
                description="Carte dos (navigation niveau produits)"
                onBack={() => toast.message("Retour catégories (dos de grille)")}
              />
            </BentoGrid>
          </div>

          <Separator className="my-6" />

          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            BentoCard nu — tailles de grille
          </p>
          <BentoGrid className="max-w-3xl">
            <BentoCard
              size="1x1"
              className="flex min-h-[10rem] items-center justify-center text-sm text-muted-foreground"
            >
              1×1
            </BentoCard>
            <BentoCard
              size="1x1"
              className="flex min-h-[10rem] items-center justify-center text-sm text-muted-foreground"
            >
              1×1
            </BentoCard>
            <BentoCard
              size="2x1"
              className="flex min-h-[10rem] items-center justify-center text-sm text-muted-foreground"
            >
              2×1
            </BentoCard>
          </BentoGrid>
        </Section>

        <Section title="DropdownMenu">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: "outline", size: "default" }))}
            >
              Ouvrir le menu
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuItem>
                  Profil
                  <DropdownMenuShortcut>⇧P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Paramètres
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={menuShowStatus}
                onCheckedChange={setMenuShowStatus}
              >
                Afficher le statut
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={menuRadio} onValueChange={setMenuRadio}>
                <DropdownMenuRadioItem value="one">Radio un</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="two">Radio deux</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Plus d’options
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Exporter</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">
                    <Trash2 className="size-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </Section>

        <Section title="Dialog, Sheet, Drawer">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(true)}>
              Ouvrir Dialog
            </Button>
            <Button type="button" variant="outline" onClick={() => setSheetOpen(true)}>
              Ouvrir Sheet
            </Button>
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(true)}>
              Ouvrir Drawer
            </Button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exemple de dialogue</DialogTitle>
                <DialogDescription>
                  Contenu minimal pour tester focus et overlay.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Fermer
                </Button>
                <Button type="button" onClick={() => setDialogOpen(false)}>
                  OK
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Feuille latérale</SheetTitle>
                <SheetDescription>
                  Même primitive que le menu mobile du dashboard.
                </SheetDescription>
              </SheetHeader>
              <p className="px-4 text-sm text-muted-foreground">
                Contenu de la sheet.
              </p>
              <SheetFooter>
                <Button type="button" onClick={() => setSheetOpen(false)}>
                  Fermer
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Tiroir (Vaul)</DrawerTitle>
                <DrawerDescription>
                  Utile sur mobile pour les fiches produit.
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-2 text-sm text-muted-foreground">
                Glisser vers le bas ou utiliser le bouton pour fermer.
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    Fermer
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </Section>

        <Section
          title="Toasts (Sonner)"
          description="Le Toaster global est déjà en haut-centre dans le layout."
        >
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => toast.success("Tout s’est bien passé.")}
            >
              Succès
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => toast.message("Message simple")}
            >
              Message
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => toast.error("Une erreur s’est produite.")}
            >
              Erreur
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                toast.promise(
                  new Promise((resolve) => setTimeout(resolve, 1200)),
                  {
                    loading: "Chargement…",
                    success: "Terminé",
                    error: "Échec",
                  }
                )
              }
            >
              Promise
            </Button>
          </div>
        </Section>
      </main>
    </div>
  );
}
