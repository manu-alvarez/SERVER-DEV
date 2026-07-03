import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "MSBrossAI - EliteScout";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom right, #0f172a, #020617)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "64px", fontWeight: "bold", background: "linear-gradient(to right, #3b82f6, #8b5cf6)", backgroundClip: "text", color: "transparent" }}>
            ⚡ MSBrossAI
          </div>
        </div>
        <div style={{ fontSize: "84px", fontWeight: "900", marginBottom: "20px", textAlign: "center", lineHeight: "1.1" }}>
          EliteScout
        </div>
        <div style={{ fontSize: "36px", color: "#94a3b8", textAlign: "center", maxWidth: "900px", lineHeight: "1.4" }}>
          Plataforma de Scouting y Análisis Deportivo
        </div>
        <div style={{ position: "absolute", bottom: "40px", fontSize: "24px", color: "#64748b" }}>
          msbross.me
        </div>
      </div>
    ),
    { ...size }
  );
}
