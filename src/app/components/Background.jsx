export default function Background({ instant = false }) {
  const cls = instant ? " bg-instant" : "";
  return (
    <>
      <div className={`bg-layers${cls}`} />
      <div className={`bg-iris${cls}`} />
      <div className={`bg-stars${cls}`} />
      <div className={`bg-grain${cls}`} />
    </>
  );
}
