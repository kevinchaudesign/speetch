import { ImageResponse } from "next/og";

export const alt = "Speetch — Studio de communication à l'ère de l'IA · Paris";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Image OG dynamique générée par Next.js. Le logo SVG ne peut pas être
// rendu directement par Satori (rendu HTML→PNG côté serveur), donc on
// utilise l'URL absolue du PNG 512 servi statiquement.
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at 30% 30%, #0F1B30 0%, #0B1220 70%)",
          color: "#F5F5F7",
          fontFamily: "Inter, sans-serif",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 48,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://speetch.com/logo/speetch-512.png"
            width={280}
            height={280}
            alt=""
            style={{ display: "block" }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <span
              style={{
                fontSize: 18,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "rgba(125, 211, 252, 0.85)",
              }}
            >
              Studio · Paris
            </span>
            <span
              style={{
                fontSize: 120,
                fontWeight: 200,
                letterSpacing: -4,
                lineHeight: 0.9,
              }}
            >
              Speetch
            </span>
            <span
              style={{
                fontSize: 22,
                fontStyle: "italic",
                color: "rgba(245, 245, 247, 0.65)",
                maxWidth: 520,
              }}
            >
              Direction artistique &amp; expériences pensées avec l&apos;IA
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
