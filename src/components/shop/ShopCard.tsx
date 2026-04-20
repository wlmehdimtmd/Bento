import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SHOP_TYPES } from "@/lib/constants";

interface ShopCardProps {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  is_active: boolean;
}

export function ShopCard({ id, name, slug, type, logo_url, is_active }: ShopCardProps) {
  const typeLabel = SHOP_TYPES.find((t) => t.value === type)?.label ?? type;

  return (
    <Link href={`/dashboard/shops/${id}`}>
      <Card className="group hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4 flex items-start gap-4">
          {/* Logo */}
          <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-border bg-muted">
            {logo_url ? (
              <Image src={logo_url} alt={name} fill className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl">
                🍱
              </span>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 space-y-1">
            <p
              className="truncate font-semibold group-hover:text-[var(--color-bento-accent)] transition-colors"
              style={{ fontFamily: "var(--font-onest)" }}
            >
              {name}
            </p>
            <p className="text-xs text-muted-foreground">/{slug}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {typeLabel}
              </Badge>
              <Badge
                variant="outline"
                className={
                  is_active
                    ? "text-emerald-600 border-emerald-500/50 text-xs"
                    : "text-muted-foreground text-xs"
                }
              >
                {is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
