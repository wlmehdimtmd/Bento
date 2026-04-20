"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Search, CheckCircle, MapPin, Star, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { ShopReviews } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────

interface ReviewsSettingsProps {
  shopId: string;
  initialReviews: ShopReviews | null;
  /** Base path pour les mutations (toggle, connect, disconnect). Défaut : `/api/reviews`. Admin : `/api/admin/reviews`. */
  reviewsMutateApiBase?: string;
  /** Masque le titre / séparateur quand le bloc est déjà dans un onglet dédié. */
  omitOuterChrome?: boolean;
}

interface AutocompletePrediction {
  place_id: string;
  name: string;
  address: string;
}

// ── Helpers ───────────────────────────────────────────────────

function staleLabel(iso: string | null): string | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
        />
      ))}
    </span>
  );
}

// ── Google Section ────────────────────────────────────────────

function GoogleSection({
  shopId,
  initial,
  reviewsMutateApiBase,
}: {
  shopId: string;
  initial: ShopReviews | null;
  reviewsMutateApiBase: string;
}) {
  const [enabled, setEnabled] = useState(initial?.google_enabled ?? false);
  const [connected, setConnected] = useState(!!initial?.google_place_id);
  const [placeName, setPlaceName] = useState(initial?.google_place_name ?? null);
  const [placeAddress, setPlaceAddress] = useState(initial?.google_place_address ?? null);
  const [rating, setRating] = useState(initial?.google_rating ?? null);
  const [reviewCount, setReviewCount] = useState(initial?.google_review_count ?? null);
  const [lastFetched, setLastFetched] = useState(initial?.google_last_fetched ?? null);

  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/reviews/google-autocomplete?input=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setPredictions(data.predictions ?? []);
        setShowDropdown((data.predictions ?? []).length > 0);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, reviewsMutateApiBase]);

  async function handleToggle(val: boolean) {
    setToggling(true);
    try {
      const res = await fetch(`${reviewsMutateApiBase}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, provider: "google", enabled: val }),
      });
      if (!res.ok) throw new Error();
      setEnabled(val);
    } catch {
      toast.error("Impossible de modifier le paramètre.");
    } finally {
      setToggling(false);
    }
  }

  async function handleSelectPlace(p: AutocompletePrediction) {
    setShowDropdown(false);
    setQuery("");
    setConnecting(true);
    try {
      const res = await fetch(`${reviewsMutateApiBase}/google-connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, placeId: p.place_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setPlaceName(data.name);
      setPlaceAddress(data.address);
      setRating(data.rating);
      setReviewCount(data.review_count);
      setLastFetched(new Date().toISOString());
      setConnected(true);
      toast.success("Restaurant Google connecté !");
    } catch (e) {
      toast.error((e as Error).message || "Impossible de connecter le restaurant.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    try {
      const res = await fetch(`${reviewsMutateApiBase}/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, provider: "google" }),
      });
      if (!res.ok) throw new Error();
      setConnected(false);
      setEnabled(false);
      setPlaceName(null);
      setPlaceAddress(null);
      setRating(null);
      setReviewCount(null);
      setLastFetched(null);
      toast.success("Déconnecté de Google.");
    } catch {
      toast.error("Impossible de dissocier.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base font-semibold flex items-center gap-2">
            <GoogleLogo />
            Afficher ma note Google
          </Label>
          <p className="text-xs text-muted-foreground">
            La note sera actualisée automatiquement chaque jour.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={toggling}
          aria-label="Activer la note Google"
        />
      </div>

      {enabled && !connected && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Trouvez votre restaurant sur Google :</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-none">
              <li>
                <span className="font-medium text-foreground">Étape 1</span> — Tapez le nom de votre restaurant ci-dessous
              </li>
              <li>
                <span className="font-medium text-foreground">Étape 2</span> — Sélectionnez-le dans la liste (vérifiez l&apos;adresse)
              </li>
              <li>
                <span className="font-medium text-foreground">Étape 3</span> — C&apos;est terminé ! Votre note se met à jour automatiquement.
              </li>
            </ol>
          </div>

          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              {searching || connecting ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
              ) : null}
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex : Le Bistrot de Mamie, Paris"
                className="pl-9 pr-9"
                disabled={connecting}
              />
            </div>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {predictions.map((p) => (
                  <button
                    key={p.place_id}
                    type="button"
                    onMouseDown={() => handleSelectPlace(p)}
                    className="w-full flex flex-col gap-0.5 px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {p.address}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {enabled && connected && (
        <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Restaurant trouvé !
              </p>
              <p className="text-sm font-medium">{placeName}</p>
              {placeAddress && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {placeAddress}
                </p>
              )}
              {rating !== null && (
                <p className="flex items-center gap-1.5 text-sm">
                  <StarRating value={rating} />
                  <span className="font-semibold">{rating.toFixed(1)}/5</span>
                  {reviewCount !== null && (
                    <span className="text-xs text-muted-foreground">— {reviewCount.toLocaleString("fr")} avis</span>
                  )}
                </p>
              )}
              {lastFetched && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Dernière mise à jour {staleLabel(lastFetched)}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setConnected(false); }}
            >
              Modifier
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={handleDisconnect}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Dissocier
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Logo SVGs ─────────────────────────────────────────────────

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────

export function ReviewsSettings({
  shopId,
  initialReviews,
  reviewsMutateApiBase = "/api/reviews",
  omitOuterChrome = false,
}: ReviewsSettingsProps) {
  const inner = (
    <>
      {!omitOuterChrome ? (
        <>
          <h2 className="text-lg font-semibold">Avis clients</h2>
          <Separator />
        </>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Associez vos pages une seule fois — les notes se mettent à jour automatiquement.
      </p>

      <div className="rounded-lg border border-border bg-card p-6">
        <GoogleSection
          shopId={shopId}
          initial={initialReviews}
          reviewsMutateApiBase={reviewsMutateApiBase}
        />
      </div>
    </>
  );

  if (omitOuterChrome) {
    return <div className="space-y-4 max-w-2xl">{inner}</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <section className="space-y-4">{inner}</section>
    </div>
  );
}
