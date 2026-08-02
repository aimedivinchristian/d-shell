import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: "50%",
          border: "2px solid #22d3ee",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "monospace",
            color: "#e8e8e8",
          }}
        >
          D<span style={{ color: "#22d3ee" }}>&gt;</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
