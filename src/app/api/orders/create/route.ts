import { NextResponse } from "next/server";

import {
  createStorefrontOrder,
  createStorefrontOrderBodySchema,
} from "@/lib/orders/createStorefrontOrder";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    const parsed = createStorefrontOrderBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const result = await createStorefrontOrder(admin, parsed.data);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ orderId: result.orderId });
  } catch (err) {
    console.error("[orders/create]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
