export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`logo ${dark ? "dark" : ""}`} aria-label="Sortly">
      <span className="logo-mark" aria-hidden>
        <i className="recycling" />
        <i className="compost" />
        <i className="trash" />
        <i className="special" />
      </span>
      <span className="logo-word">sortly</span>
    </div>
  );
}
