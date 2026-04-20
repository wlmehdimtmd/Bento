"use client";

import { useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface QRCodeDisplayProps {
  url: string;
  shopName?: string;
}

export function QRCodeDisplay({ url, shopName }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const downloadPNG = () => {
    // QRCodeCanvas renders a <canvas> element directly; find it in the hidden div
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qr-${shopName ?? "boutique"}.png`;
    link.click();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Visible SVG QR code */}
      <div className="rounded-2xl border-4 border-[var(--color-bento-accent)] p-3 bg-white">
        <QRCodeSVG
          value={url}
          size={200}
          bgColor="#ffffff"
          fgColor="#1a1a1a"
          level="M"
        />
      </div>

      {/* Hidden canvas for PNG download */}
      <div ref={canvasRef} className="hidden" aria-hidden>
        <QRCodeCanvas
          value={url}
          size={400}
          bgColor="#ffffff"
          fgColor="#1a1a1a"
          level="M"
        />
      </div>

      <p className="text-xs text-muted-foreground break-all text-center max-w-[280px]">
        {url}
      </p>

      <div className="flex gap-2 w-full">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={downloadPNG}>
          <Download className="mr-1.5 h-4 w-4" />
          Télécharger PNG
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={copyLink}>
          {copied ? (
            <Check className="mr-1.5 h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="mr-1.5 h-4 w-4" />
          )}
          Copier le lien
        </Button>
      </div>
    </div>
  );
}
