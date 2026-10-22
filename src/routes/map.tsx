import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import "leaflet/dist/leaflet.css";
import { Screen, Card, LoadBadge, DemoTag } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { centers, centerLoad, centerWaitMin, getCenter } from "@/lib/centers";
export const Route = createFileRoute("/map")({
  validateSearch: z.object({ center: z.string().optional() }),
  component: MapPage,
});
function MapPage() {
  const { state, copy } = useStore();
  const search = Route.useSearch();
  const element = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    setFailed(false);
    void import("leaflet")
      .then(({ default: L }) => {
        if (disposed || !element.current) return;
        const selected = search.center ? getCenter(search.center) : null;
        map = L.map(element.current).setView(
          selected ? [selected.lat, selected.lng] : [43.652, 51.168],
          selected ? 15 : 13,
        );
        const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);
        tiles.on("tileerror", () => {
          if (!disposed) setFailed(true);
        });
        centers.forEach((c) => {
          const load = centerLoad(c);
          const icon = L.divIcon({
            className: "",
            html: `<div class="sq-marker sq-marker--${load} ${selected?.id === c.id ? "sq-marker--active" : ""}">${centerWaitMin(c)}</div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });
          const popup = document.createElement("div");
          const heading = document.createElement("strong");
          heading.textContent = c.name[state.lang];
          const line = document.createElement("p");
          line.textContent = `${c.address[state.lang]} · ~${centerWaitMin(c)} ${copy("мин", "мин")}`;
          const link = document.createElement("a");
          link.href = `/center/${c.id}`;
          link.textContent = copy("Открыть центр →", "Орталықты ашу →");
          popup.append(heading, line, link);
          const marker = L.marker([c.lat, c.lng], { icon }).addTo(map!).bindPopup(popup);
          if (selected?.id === c.id) marker.openPopup();
        });
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [state.lang, search.center]);
  return (
    <Screen
      title={copy("Карта центров", "Орталықтар картасы")}
      subtitle={copy(
        "Актау · выберите учреждение на карте.",
        "Ақтау · картадан мекемені таңдаңыз.",
      )}
      right={<DemoTag />}
    >
      <Card className="overflow-hidden relative">
        <div
          ref={element}
          className="h-[420px] sm:h-[500px] w-full z-0"
          aria-label={copy(
            "Карта медицинских центров Актау",
            "Ақтау медициналық орталықтарының картасы",
          )}
        />
      </Card>
      {failed && (
        <p className="demo-note mt-3" role="status">
          {copy(
            "Карта не загрузилась полностью. Проверьте интернет или выберите центр в списке ниже.",
            "Карта толық жүктелмеді. Интернетті тексеріңіз немесе төмендегі тізімнен орталықты таңдаңыз.",
          )}
        </p>
      )}
      <div className="clinic-grid mt-5">
        {centers.map((c) => (
          <Link key={c.id} to="/center/$id" params={{ id: c.id }}>
            <Card className="p-5 h-full">
              <h2 className="text-sm font-medium">{c.name[state.lang]}</h2>
              <p className="text-xs text-muted-foreground mt-2">{c.address[state.lang]}</p>
              <div className="mt-4 flex justify-between gap-3">
                <LoadBadge level={centerLoad(c)} />
                <span className="text-xs text-muted-foreground">
                  ~{centerWaitMin(c)} {copy("мин", "мин")}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-4">
        {copy(
          "Карта © OpenStreetMap. Очереди — демонстрационные.",
          "Карта © OpenStreetMap. Кезектер — демонстрациялық.",
        )}
      </p>
    </Screen>
  );
}
