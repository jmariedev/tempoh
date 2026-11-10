import { stripBullet, toLines, type RichText, type Segment } from "@/lib/richtext";

function Run({ seg }: { seg: Segment }) {
  // Plain web addresses become links too, such as a pasted costume shop URL.
  let node: React.ReactNode = seg.href
    ? seg.text
    : seg.text.split(/(https?:\/\/\S+)/g).map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noreferrer" className="link">
            {part.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
          </a>
        ) : (
          part
        ),
      );
  if (seg.bold) node = <strong>{node}</strong>;
  if (seg.italic) node = <em>{node}</em>;
  if (seg.underline) node = <u>{node}</u>;
  if (seg.strike) node = <s>{node}</s>;
  if (seg.href) {
    node = (
      <a href={seg.href} target="_blank" rel="noreferrer" className="link">
        {node}
      </a>
    );
  }
  return <>{node}</>;
}

const Line = ({ line }: { line: RichText }) => (
  <>
    {line.map((seg, i) => (
      <Run key={i} seg={seg} />
    ))}
  </>
);

/** Shows formatted text, with bullet lines as a real list. */
export default function RichTextView({ value, className }: { value: RichText; className?: string }) {
  const blocks: ({ kind: "p"; line: RichText } | { kind: "ul"; items: RichText[] })[] = [];
  for (const line of toLines(value)) {
    const bullet = stripBullet(line);
    const last = blocks[blocks.length - 1];
    if (bullet && last?.kind === "ul") last.items.push(bullet);
    else if (bullet) blocks.push({ kind: "ul", items: [bullet] });
    else blocks.push({ kind: "p", line });
  }

  return (
    <div className={`rich${className ? ` ${className}` : ""}`}>
      {blocks.map((b, i) =>
        b.kind === "ul" ? (
          <ul key={i}>
            {b.items.map((item, j) => (
              <li key={j}>
                <Line line={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.line.length ? <Line line={b.line} /> : <br />}</p>
        ),
      )}
    </div>
  );
}
