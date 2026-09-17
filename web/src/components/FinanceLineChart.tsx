export interface FinanceLineSeries {
  name: string;
  color: string;
  values: number[];
}

export const MONTHS_TR = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

export const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad = { top: 10, right: 32, bottom: 4, left: 4 };
const W = 320;
const H = 118;
const innerW = W - pad.left - pad.right;
const innerH = H - pad.top - pad.bottom;

function compact(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e6) return "₺" + (abs / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return "₺" + (abs / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return "₺" + String(Math.round(abs));
}

export default function FinanceLineChart({
  title,
  note,
  series,
  labels,
}: {
  title?: string;
  note?: string;
  series: FinanceLineSeries[];
  labels: string[];
}) {
  const count = labels.length;
  const maxV = Math.max(1, ...series.flatMap((s) => s.values));
  const slots = Math.max(1, count - 1);
  const stepX = innerW / slots;
  const grid = [1, 0.5, 0];
  const labelEvery = count > 14 ? Math.ceil(count / 8) : count > 8 ? 2 : 1;

  const x = (i: number) => pad.left + i * stepX;
  const y = (v: number) => pad.top + innerH - (v / maxV) * innerH;

  return (
    <div className="an-fl-chart">
      {(title || note) && (
        <div className="an-fl-head">
          {title && <strong>{title}</strong>}
          {note && <span>{note}</span>}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="an-fl-svg" aria-hidden="true">
        {grid.map((g) => (
          <line
            key={g}
            x1={pad.left}
            y1={y(maxV * g)}
            x2={W - pad.right}
            y2={y(maxV * g)}
            stroke="var(--sc-border2)"
            strokeWidth="1"
            strokeDasharray={g !== 0 && g !== 1 ? "4 4" : undefined}
          />
        ))}
        {grid.map((g) => (
          <text
            key={g}
            x={W - pad.right}
            y={y(maxV * g) - 3}
            fontSize="7.5"
            fill="var(--sc-muted)"
            textAnchor="end"
          >
            {compact(maxV * g)}
          </text>
        ))}
        {series.map((s) => (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(v)}
                r="2.2"
                fill={s.color}
                stroke="var(--sc-card)"
                strokeWidth="1"
              />
            ))}
          </g>
        ))}
      </svg>
      <div className="an-fl-leg">
        {series.map((s) => (
          <span key={s.name}>
            <i style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <div className="an-fl-x">
        {labels.map((l, i) => (i % labelEvery === 0 ? <span key={l}>{l}</span> : null))}
      </div>
    </div>
  );
}