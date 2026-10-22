import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CameraOff, QrCode, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { parseQrPayload, getCenter } from "@/lib/centers";
import { Button } from "@/components/ui-kit";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Сканировать QR — SmartQ" },
      { name: "description", content: "Наведите камеру на QR-код медицинского центра, чтобы войти в электронную очередь SmartQ." },
      { property: "og:title", content: "Сканировать QR — SmartQ" },
      { property: "og:description", content: "Вход в электронную очередь по QR-коду медицинского центра." },
    ],
  }),
  component: ScanPage,
});

type CamState = "requesting" | "active" | "denied" | "unsupported";

function ScanPage() {
  const { t, state } = useStore();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cam, setCam] = useState<CamState>("requesting");
  const [found, setFound] = useState<string | null>(null);
  const [unknown, setUnknown] = useState(false);
  const foundRef = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;
    let jsQR: typeof import("jsqr").default | null = null;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCam("unsupported");
        return;
      }
      try {
        const mod = await import("jsqr");
        jsQR = mod.default;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setCam("active");
        tick();
      } catch {
        if (!cancelled) setCam("denied");
      }
    }

    function tick() {
      if (cancelled || foundRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && jsQR && video.readyState === video.HAVE_ENOUGH_DATA) {
        const size = 320;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const s = Math.min(vw, vh);
        ctx.drawImage(video, (vw - s) / 2, (vh - s) / 2, s, s, 0, 0, size, size);
        const img = ctx.getImageData(0, 0, size, size);
        const code = jsQR(img.data, size, size, { inversionAttempts: "dontInvert" });
        if (code?.data) {
          const id = parseQrPayload(code.data);
          if (id) {
            foundRef.current = true;
            onFound(id);
            return;
          }
          setUnknown(true);
          window.setTimeout(() => setUnknown(false), 2500);
        }
      }
      raf = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFound(id: string) {
    setFound(id);
    if ("vibrate" in navigator) navigator.vibrate?.(80);
    window.setTimeout(() => navigate({ to: "/center/$id", params: { id }, search: { from: "qr" } }), 900);
  }

  function demoScan() {
    foundRef.current = true;
    onFound("onco-center");
  }

  const foundCenter = found ? getCenter(found) : null;

  return (
    <div className="relative flex min-h-dvh flex-col bg-foreground text-primary-foreground">
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      <header className="relative z-10 flex h-13 items-center justify-between px-4 safe-top">
        <span className="text-[16px] font-semibold">{t("scan_title")}</span>
        <Link to="/" aria-label={t("scan_cancel")} className="grid h-9 w-9 place-items-center rounded-full bg-foreground/50">
          <X className="h-5 w-5" />
        </Link>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div className="relative h-64 w-64">
          <div className="absolute inset-0 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
          <Corner className="left-0 top-0 rounded-tl-xl border-l-[3px] border-t-[3px]" />
          <Corner className="right-0 top-0 rounded-tr-xl border-r-[3px] border-t-[3px]" />
          <Corner className="bottom-0 left-0 rounded-bl-xl border-b-[3px] border-l-[3px]" />
          <Corner className="bottom-0 right-0 rounded-br-xl border-b-[3px] border-r-[3px]" />
          {cam === "active" && !found && (
            <div className="absolute left-3 right-3 top-3 h-0.5 rounded bg-primary-foreground/80 sq-scanline" />
          )}
          {cam !== "active" && !found && (
            <div className="absolute inset-0 grid place-items-center">
              <CameraOff className="h-9 w-9 text-primary-foreground/60" />
            </div>
          )}
          {found && (
            <div className="absolute inset-0 grid place-items-center rounded-xl bg-success/90">
              <div className="text-center">
                <QrCode className="mx-auto h-9 w-9" />
                <div className="mt-2 text-[13px] font-medium">{t("scan_found")}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 min-h-12 text-center">
          {found && foundCenter ? (
            <p className="text-[16px] font-semibold">{foundCenter.name[state.lang]}</p>
          ) : cam === "requesting" ? (
            <p className="text-[14px] text-primary-foreground/80">{t("scan_requesting")}</p>
          ) : cam === "active" ? (
            <p className="text-[15px]">{unknown ? t("scan_unknown") : t("scan_hint")}</p>
          ) : (
            <>
              <p className="text-[15px] font-medium">{t("scan_denied")}</p>
              <p className="mt-1 text-[13px] text-primary-foreground/75">{t("scan_deniedHint")}</p>
            </>
          )}
        </div>
      </div>

      <div className="relative z-10 space-y-2 px-4 pb-8 safe-bottom">
        <Button variant="secondary" onClick={demoScan} disabled={!!found} className="bg-card text-primary">
          <QrCode className="h-5 w-5" />
          {t("scan_demo")}
        </Button>
        <Link to="/" className="block">
          <Button variant="ghost" className="text-primary-foreground">
            {t("scan_cancel")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return <span className={`absolute h-8 w-8 border-primary-foreground ${className}`} />;
}
