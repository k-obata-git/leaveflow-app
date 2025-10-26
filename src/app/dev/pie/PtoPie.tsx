"use client";

import React from "react";

type Slice = {
  label: string;
  value: number;
  color?: string;
};

type Props = {
  data: Slice[];
  size?: number;
  thickness?: number;
  totalOverride?: number;
  title?: string;
};

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  innerR = 0
) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  const p1 = polar(cx, cy, r, endAngle);
  const p2 = polar(cx, cy, r, startAngle);

  if (innerR <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${p2.x} ${p2.y}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
      "Z",
    ].join(" ");
  } else {
    const q1 = polar(cx, cy, innerR, endAngle);
    const q2 = polar(cx, cy, innerR, startAngle);
    return [
      `M ${p2.x} ${p2.y}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
      `L ${q1.x} ${q1.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${q2.x} ${q2.y}`,
      "Z",
    ].join(" ");
  }
}

const defaultPalette = [
  "var(--brand-800, #324d8c)",
  "var(--brand-600, #556eb6)",
  "var(--brand-400, #8fa3d8)",
  "var(--brand-200, #cfd9f1)",
  "var(--brand-900, #293e72)",
  "var(--brand-300, #b1c0e6)",
];

export default function PtoPie({
  data,
  size = 240,
  thickness = 36,
  totalOverride,
  title,
}: Props) {
  const total = totalOverride ?? data.reduce((a, b) => a + (b.value || 0), 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 4) / 2;
  const innerR = Math.max(0, r - thickness);

  let acc = 0;
  const slices = data.map((s, i) => {
    const pct = total > 0 ? (s.value / total) : 0;
    const start = acc * 360;
    const end = (acc + pct) * 360;
    acc += pct;

    const color = s.color ?? defaultPalette[i % defaultPalette.length];
    const path = arcPath(cx, cy, r, start, end, innerR);

    const mid = (start + end) / 2;
    const labelR = innerR > 0 ? (innerR + r) / 2 : r * 0.6;
    const lp = polar(cx, cy, labelR, mid);
    const percent = Math.round(pct * 100);

    return { ...s, color, path, labelPos: lp, percent };
  });

  const centerText = totalOverride
    ? `${data.reduce((a, b) => a + (b.value || 0), 0)} / ${totalOverride}`
    : `${total}`;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {title && <div style={{ fontWeight: 700 }}>{title}</div>}

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={title ?? "Pie"}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="var(--color-primary-subtle, #f2f4fb)"
        />

        {slices.map((s, i) => (
          <g key={i}>
            <path d={s.path} fill={s.color} />
            {/* ラベル + 割合を2行で表示 */}
            {s.percent >= 5 && (
              <text
                x={s.labelPos.x}
                y={s.labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: 11, fill: "#fff", fontWeight: 600 }}
              >
                <tspan x={s.labelPos.x} dy="-0.2em">{s.label}</tspan>
                <tspan x={s.labelPos.x} dy="1.2em">{s.percent}%</tspan>
              </text>
            )}
          </g>
        ))}

        {innerR > 0 && (
          <>
            <circle cx={cx} cy={cy} r={innerR - 1} fill="#fff" />
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              dominantBaseline="ideographic"
              style={{ fontSize: 16, fontWeight: 800, fill: "var(--brand-800, #324d8c)" }}
            >
              {centerText}
            </text>
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              style={{ fontSize: 11, fill: "#6b7280" }}
            >
              合計（日）
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
