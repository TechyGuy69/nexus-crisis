import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ style = {} }) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 38, height: 38,
        borderRadius: 10,
        border: "1px solid var(--border2)",
        background: "var(--bg3)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        transition: "all 0.2s",
        flexShrink: 0,
        ...style
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg4)"}
      onMouseLeave={e => e.currentTarget.style.background = "var(--bg3)"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}