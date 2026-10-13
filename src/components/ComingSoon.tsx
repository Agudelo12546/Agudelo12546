export function ComingSoon({ title, sub, what }: { title: string; sub: string; what: string[] }) {
  return (
    <section className="view">
      <h2>{title}</h2>
      <p className="sub">{sub}</p>
      <div className="empty">
        <b>Estamos construyendo esta sección.</b>
        <span>Muy pronto vas a poder:</span>
        <ul style={{ textAlign: "left", margin: 0 }}>
          {what.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
