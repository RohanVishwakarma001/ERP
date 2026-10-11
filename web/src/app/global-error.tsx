"use client";

/** Last-resort boundary for errors in the root layout itself (renders its own <html>). */
export default function GlobalError({ retry }: { error: Error; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 18 }}>JBIT Campus ERP is temporarily unavailable</h1>
          <p style={{ fontSize: 13, color: "#64748B" }}>Please try again in a moment.</p>
          <button onClick={() => retry()} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, border: 0, background: "#0b3b60", color: "#fff" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
