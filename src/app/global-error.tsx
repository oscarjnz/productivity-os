"use client";

/**
 * Catches errors thrown in the root layout itself (the last line of defense).
 * Must render its own <html>/<body> because the root layout failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0E0E14",
          color: "#EEEEF5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 380 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            Something broke at the root.
          </div>
          <div style={{ fontSize: 12, color: "#8888A8", marginBottom: 16 }}>
            {error.message?.slice(0, 160) || "Unexpected error"}
          </div>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "rgba(124,131,246,0.14)",
              color: "#7C83F6",
              border: "1px solid rgba(124,131,246,0.3)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
