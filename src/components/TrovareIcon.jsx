export default function TrovareIcon({ size = 28, color = "#00F5A0", bg = "transparent" }) {
  return (
    <div style={{
      width: size,
      height: size,
      background: bg !== "transparent" ? `linear-gradient(135deg, #00F5A0, #00D9F5)` : "transparent",
      borderRadius: size * 0.3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 26 26" fill="none">
        <path d="M4 13 L13 4 L22 13 L13 22 Z"
          fill="none"
          stroke={bg !== "transparent" ? "#080810" : color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M9 13 L13 9 L17 13 L13 17 Z"
          fill={bg !== "transparent" ? "#080810" : color}
        />
      </svg>
    </div>
  );
}