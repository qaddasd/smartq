import type { ReactNode, SVGProps } from "react";

export type SmartIconName =
  | "home"
  | "clinic"
  | "booking"
  | "visits"
  | "queue"
  | "scan"
  | "map"
  | "profile"
  | "more"
  | "forecast"
  | "science"
  | "economics"
  | "staff"
  | "bell"
  | "arrow"
  | "shield";

/** Original SmartQ pictograms, drawn on one 48-unit grid. */
const drawings: Record<SmartIconName, ReactNode> = {
  home: (
    <>
      <path d="m7 22 17-15 17 15M12 19v23h24V19M20 42V29h8v13" />
      <path d="M30 10V6h6v9" />
    </>
  ),
  clinic: (
    <>
      <path d="m6 22 18-16 18 16M11 19v23h26V19M19 42V31h10v11" />
      <path d="M17 22h4l3-6 3 12 3-6h3" />
    </>
  ),
  booking: (
    <>
      <rect x="8" y="10" width="32" height="32" rx="6" />
      <path d="M8 20h32M16 6v8M32 6v8M17 30h14M24 23v14" />
    </>
  ),
  visits: (
    <>
      <rect x="9" y="8" width="30" height="34" rx="5" />
      <path d="M17 5v7M31 5v7M9 19h30M17 29l5 5 10-11M16 38h16" />
    </>
  ),
  queue: (
    <>
      <circle cx="14" cy="12" r="4" />
      <path d="M6 30v-3a8 8 0 0 1 16 0v3M12 35h24M12 42h18M29 10h12M29 18h8M29 26h12" />
    </>
  ),
  scan: (
    <>
      <path d="M18 6H7v11M30 6h11v11M7 31v11h11M41 31v11H30M4 24h40" />
      <path d="M14 13h6v6h-6zM28 13h6v6h-6zM14 30h6v6h-6zM28 30v6h6v-3M34 27v1" />
    </>
  ),
  map: (
    <>
      <path d="m5 17 12-5 14 5 12-5v28l-12 4-14-5-12 5V17M17 27v12M31 31v13" />
      <path d="M32 13c0 6-8 14-8 14s-8-8-8-14a8 8 0 1 1 16 0Z" />
      <circle cx="24" cy="13" r="2.5" />
    </>
  ),
  profile: (
    <>
      <rect x="10" y="6" width="28" height="35" rx="5" />
      <circle cx="24" cy="18" r="5" />
      <path d="M16 31a8 8 0 0 1 16 0M17 36h14M6 33v7a5 5 0 0 0 5 5h25" />
    </>
  ),
  more: (
    <>
      {[12, 24, 36].flatMap((x) =>
        [12, 24, 36].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="currentColor" stroke="none" />
        )),
      )}
    </>
  ),
  forecast: (
    <>
      <path d="M7 7v34h35M12 29l9-10 8 6 12-16M33 9h8v8" />
      <path d="M16 35v-4M26 35v-4M36 35V24" />
    </>
  ),
  science: (
    <>
      <path d="M24 12C18 7 11 7 5 9v30c6-2 13-2 19 3 6-5 13-5 19-3V9c-6-2-13-2-19 3v30M11 16h6M11 23h6M31 16h6M31 23h6" />
    </>
  ),
  economics: (
    <>
      <rect x="10" y="5" width="28" height="38" rx="5" />
      <path d="M16 12h16v7H16zM17 26h2M29 26h2M17 34h2M29 34h2" />
    </>
  ),
  staff: (
    <>
      <path d="M10 7v10a9 9 0 0 0 18 0V7M7 7h6M25 7h6M19 26v7a9 9 0 0 0 18 0v-4" />
      <circle cx="37" cy="24" r="5" />
    </>
  ),
  bell: (
    <>
      <path d="M10 34h28l-4-6V19a10 10 0 0 0-20 0v9l-4 6ZM20 40a4 4 0 0 0 8 0M24 5v4" />
    </>
  ),
  arrow: (
    <>
      <path d="M8 24h31M28 13l11 11-11 11" />
    </>
  ),
  shield: (
    <>
      <path d="m24 5 16 7-2 14c-2 8-8 14-14 17-6-3-12-9-14-17L8 12l16-7Z" />
      <path d="m17 24 5 5 10-11" />
    </>
  ),
};

export function SmartIcon({
  name,
  size = 24,
  ...props
}: SVGProps<SVGSVGElement> & { name: SmartIconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {drawings[name]}
    </svg>
  );
}

export function BrandMark({ size = 36, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <path
        d="M35.5 34.5A17 17 0 1 0 25 41"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="m11 25 7 0 4-9 6 17 4-8h8M33 36l8 7"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PromoArtwork({ variant }: { variant: "calendar" | "profile" | "map" }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="promo-artwork">
      {variant === "calendar" ? (
        <>
          <rect x="20" y="28" width="78" height="70" rx="12" fill="#eaf5ff" />
          <path d="M20 49h78" stroke="#a8c6e5" strokeWidth="3" />
          <path d="M39 21v16M78 21v16" stroke="#c9e0f5" strokeWidth="8" strokeLinecap="round" />
          <rect x="33" y="61" width="14" height="10" rx="3" fill="#a5c8e3" />
          <rect x="54" y="61" width="14" height="10" rx="3" fill="#a5c8e3" />
          <circle cx="88" cy="88" r="22" fill="#43bc9c" />
          <path
            d="m78 88 7 7 13-16"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : variant === "profile" ? (
        <>
          <rect
            x="26"
            y="17"
            width="71"
            height="89"
            rx="12"
            fill="#dcecf7"
            transform="rotate(8 26 17)"
          />
          <rect x="18" y="20" width="72" height="88" rx="12" fill="#f6fafc" />
          <circle cx="54" cy="49" r="13" fill="#6caecb" />
          <path d="M32 79a22 22 0 0 1 44 0" fill="#6caecb" />
          <path d="M35 94h38" stroke="#b5d3df" strokeWidth="5" strokeLinecap="round" />
          <circle cx="91" cy="90" r="19" fill="#36b292" />
          <path
            d="m83 89 6 6 10-12"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path d="m9 35 32-12 34 12 33-12v71l-33 12-34-12-32 12V35Z" fill="#daedf2" />
          <path d="M41 23v71M75 35v71" stroke="#9fc5ce" strokeWidth="3" />
          <path d="M89 39c0 15-25 36-25 36S39 54 39 39a25 25 0 0 1 50 0Z" fill="#33b695" />
          <circle cx="64" cy="39" r="9" fill="#e5f7f1" />
        </>
      )}
    </svg>
  );
}

export function ScreeningArtwork() {
  return (
    <svg className="screening-artwork" viewBox="0 0 270 260" fill="none" aria-hidden="true">
      <circle cx="145" cy="137" r="94" fill="#343a40" />
      <circle cx="145" cy="137" r="74" stroke="#414a51" strokeWidth="1.5" strokeDasharray="4 10" />
      <path
        d="M43 109h-9M38.5 104.5v9M224 184h16M232 176v16"
        stroke="#74869a"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="230" cy="64" r="6" fill="#566777" />
      <circle cx="59" cy="202" r="5" fill="#566777" />
      <rect
        x="91"
        y="50"
        width="118"
        height="161"
        rx="17"
        fill="#bacdd5"
        transform="rotate(8 91 50)"
      />
      <rect x="78" y="47" width="118" height="161" rx="16" fill="#e9f0f3" />
      <rect x="112" y="40" width="49" height="16" rx="6" fill="#8ba5b6" />
      <circle cx="137" cy="96" r="25" fill="#45b99b" />
      <path
        d="m125 96 8 8 17-20"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M98 144h21l8-15 14 30 10-19h24"
        stroke="#82aabd"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M102 180h35M102 191h54" stroke="#bacdd7" strokeWidth="5" strokeLinecap="round" />
      <path d="M57 149h29v72a14.5 14.5 0 0 1-29 0v-72Z" fill="#f5f9fb" />
      <path d="M57 183c9-6 20 6 29 0v38a14.5 14.5 0 0 1-29 0v-38Z" fill="#58bcae" />
      <path d="M53 148h37" stroke="#cfe0e8" strokeWidth="7" strokeLinecap="round" />
      <path
        d="M189 161v25l-25 38a13 13 0 0 0 11 20h48a13 13 0 0 0 11-20l-25-38v-25"
        fill="#dfeef4"
      />
      <path
        d="M178 204c12-10 28 10 43 0l13 20a13 13 0 0 1-11 20h-48a13 13 0 0 1-11-20l14-20Z"
        fill="#69afcf"
      />
      <path d="M183 161h32" stroke="#c7dce5" strokeWidth="7" strokeLinecap="round" />
      <circle cx="197" cy="223" r="4" fill="#e9f7fb" />
      <path d="m224 21 4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" fill="#849aaf" />
    </svg>
  );
}
