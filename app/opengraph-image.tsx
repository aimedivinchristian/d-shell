import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "D>shell — learn Linux by using it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0a0a0a",
          padding: "80px",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 72,
            fontWeight: 700,
            color: "#e8e8e8",
            marginBottom: 28,
          }}
        >
          D<span style={{ color: "#22d3ee" }}>&gt;</span>
          <span style={{ color: "#8a8a8a", marginLeft: 4 }}>shell</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#8a8a8a", maxWidth: 820 }}>
          Learn Linux by using it. A real shell, running in your browser.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 56,
            fontSize: 24,
            color: "#22d3ee",
          }}
        >
          $ whoami<span style={{ color: "#e8e8e8", marginLeft: 12 }}>learner</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
