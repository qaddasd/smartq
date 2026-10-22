import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, QrCode, X, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { parseQrPayload, getCenter } from "@/lib/centers";
import { Button } from "@/components/ui-kit";

export const Route = createFileRoute("/scan")({
  head: () => ({ meta: [{ title: "Сканировать QR — SmartQ" }] }),
  component: ScanPage,
});
type CamState =
  "idle" | "requesting" | "active" | "denied" | "unsupported" | "missing" | "busy" | "timeout";
function ScanPage() {
  const { copy, state } = useStore();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const frameRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const navigationRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [cam, setCam] = useState<CamState>("idle");
  const [found, setFound] = useState<string | null>(null);
  const [unknown, setUnknown] = useState(false);
  const foundRef = useRef(false);
  function stop() {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }
  useEffect(
    () => () => {
      requestRef.current++;
      stop();
      clearTimeout(timerRef.current);
      clearTimeout(navigationRef.current);
    },
    [],
  );
  function onFound(id: string) {
    foundRef.current = true;
    stop();
    setFound(id);
    navigationRef.current = setTimeout(() => {
      void navigate({ to: "/center/$id", params: { id }, search: { from: "qr" } });
    }, 900);
  }
  function tick() {
    const video = videoRef.current,
      canvas = canvasRef.current;
    if (!video || !canvas || foundRef.current) return;
    if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
      canvas.width = canvas.height = 320;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        const side = Math.min(video.videoWidth, video.videoHeight);
        ctx.drawImage(
          video,
          (video.videoWidth - side) / 2,
          (video.videoHeight - side) / 2,
          side,
          side,
          0,
          0,
          320,
          320,
        );
        const pixels = ctx.getImageData(0, 0, 320, 320);
        const code = jsQR(pixels.data, 320, 320, { inversionAttempts: "attemptBoth" });
        if (code?.data) {
          const id = parseQrPayload(code.data);
          if (id) {
            onFound(id);
            return;
          }
          setUnknown(true);
        } else setUnknown(false);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
  }
  async function startCamera() {
    stop();
    const request = ++requestRef.current;
    clearTimeout(timerRef.current);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCam("unsupported");
      return;
    }
    setCam("requesting");
    timerRef.current = setTimeout(() => {
      if (request !== requestRef.current) return;
      requestRef.current++;
      stop();
      setCam("timeout");
    }, 15000);
    try {
      // Request directly from the button gesture, before any imports or other awaits.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (request !== requestRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stop();
        return;
      }
      video.srcObject = stream;
      await video.play();
      if (request !== requestRef.current) {
        stop();
        return;
      }
      clearTimeout(timerRef.current);
      setCam("active");
      tick();
    } catch (error) {
      if (request !== requestRef.current) return;
      clearTimeout(timerRef.current);
      stop();
      const name = error instanceof DOMException ? error.name : "";
      setCam(
        name === "NotFoundError" ? "missing" : name === "NotReadableError" ? "busy" : "denied",
      );
    }
  }
  const foundCenter = found ? getCenter(found) : null;
  const messages: Record<CamState, string> = {
    idle: copy(
      "Включите камеру и наведите её на QR-код центра",
      "Камераны қосып, орталықтың QR-кодына бағыттаңыз",
    ),
    requesting: copy(
      "Разрешите доступ в окне браузера…",
      "Браузер терезесінде камераға рұқсат беріңіз…",
    ),
    active: copy("Поместите QR-код центра в рамку", "Орталықтың QR-кодын жақтауға орналастырыңыз"),
    denied: copy("Доступ к камере не разрешён", "Камераға рұқсат берілмеді"),
    unsupported: copy("В этом браузере камера недоступна", "Бұл браузерде камера қолжетімсіз"),
    missing: copy("Камера не найдена на устройстве", "Құрылғыда камера табылмады"),
    busy: copy("Камера занята другим приложением", "Камераны басқа қолданба пайдаланып жатыр"),
    timeout: copy("Браузер пока не предоставил доступ", "Браузер камераға рұқсат берген жоқ"),
  };
  return (
    <div className="scanner-page">
      <video
        ref={videoRef}
        className="scanner-video"
        playsInline
        muted
        autoPlay
        aria-label={copy("Камера для сканирования QR", "QR сканерлеу камерасы")}
      />
      <canvas ref={canvasRef} hidden />
      <header className="scanner-header">
        <h1>{copy("Сканирование QR", "QR сканерлеу")}</h1>
        <Link to="/" aria-label={copy("Закрыть сканер", "Сканерді жабу")}>
          <X />
        </Link>
      </header>
      <div className="scanner-content">
        <div className="scanner-frame">
          {cam !== "active" && !found && <CameraOff size={42} />}
          {cam === "active" && !found && <div className="scanner-line sq-scanline" />}
          {found && <QrCode size={52} />}
        </div>
        <div className="scanner-status" role="status" aria-live="polite">
          <h2>
            {foundCenter
              ? foundCenter.name[state.lang]
              : unknown
                ? copy("Это не QR-код центра SmartQ", "Бұл SmartQ орталығының QR-коды емес")
                : messages[cam]}
          </h2>
          {cam !== "active" && cam !== "idle" && cam !== "requesting" && (
            <p>
              {copy(
                "Откройте сайт в Safari или Chrome. В настройках сайта разрешите камеру. Если она занята, закройте видеозвонок и попробуйте снова.",
                "Сайтты Safari немесе Chrome арқылы ашыңыз. Сайт баптауларында камераға рұқсат беріңіз. Камера бос болмаса, бейнеқоңырауды жауып, қайталап көріңіз.",
              )}
            </p>
          )}
        </div>
      </div>
      <div className="scanner-actions">
        {!found && cam !== "active" && (
          <Button onClick={() => void startCamera()} disabled={cam === "requesting"}>
            {cam === "idle" ? <Camera size={20} /> : <RotateCcw size={20} />}
            {copy(
              cam === "idle"
                ? "Включить камеру"
                : cam === "requesting"
                  ? "Ожидаем разрешение…"
                  : "Попробовать снова",
              cam === "idle"
                ? "Камераны қосу"
                : cam === "requesting"
                  ? "Рұқсат күтілуде…"
                  : "Қайталап көру",
            )}
          </Button>
        )}
        <Link to="/centers" className="scanner-manual">
          {copy("Выбрать центр без камеры", "Камерасыз орталықты таңдау")}
        </Link>
        <Button
          variant="secondary"
          onClick={() => {
            requestRef.current++;
            clearTimeout(timerRef.current);
            onFound("onco-center");
          }}
          disabled={!!found}
        >
          <QrCode size={18} />
          {copy("Демо: распознать QR центра", "Демо: орталықтың QR-кодын тану")}
        </Button>
        <p>
          {copy(
            "Камера используется только для чтения QR. Видео не отправляется на сервер.",
            "Камера тек QR оқу үшін қолданылады. Бейне серверге жіберілмейді.",
          )}
        </p>
      </div>
    </div>
  );
}
