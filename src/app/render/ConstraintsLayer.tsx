import { Fragment } from "react";
import useEditorStore from "../editorStore";
import { EConstraint, EGeo, TConstraint } from "@/core/types";
import useTheme from "../utils/useTheme";

type TLabel<C extends EConstraint = EConstraint> = { x: number; y: number; con: TConstraint & { constraint: C } };
type TLabelCluster = { x: number; y: number; labels: TLabel[] };

const markerChars: { [K in EConstraint]?: string } = {
  [EConstraint.PointOnLine]: "!",
  [EConstraint.PointOnCircle]: "Q",
  [EConstraint.Vertical]: "|",
  [EConstraint.Horizontal]: "-",
  [EConstraint.Perpendicular]: "T",
  [EConstraint.Parallel]: "/",
};

const alwaysWithNumber = new Set([EConstraint.Perpendicular, EConstraint.Parallel]);

function clusterLabels(labels: TLabel[], threshold: number): TLabelCluster[] {
  const clusters: TLabelCluster[] = [];

  for (const label of labels) {
    let addedToCluster = false;

    // Проверяем все существующие кластеры
    for (const cluster of clusters) {
      // Вычисляем расстояние между текущей подписью и центром кластера
      const dx = label.x - cluster.x;
      const dy = label.y - cluster.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Если расстояние меньше порога, добавляем подпись в кластер
      if (distance < threshold) {
        cluster.labels.push(label);
        // Пересчитываем центр кластера как среднее всех подписей
        cluster.x = cluster.labels.reduce((sum, l) => sum + l.x, 0) / cluster.labels.length;
        cluster.y = cluster.labels.reduce((sum, l) => sum + l.y, 0) / cluster.labels.length;
        addedToCluster = true;
        break;
      }
    }

    // Если подпись не была добавлена ни в один кластер, создаем новый
    if (!addedToCluster) {
      clusters.push({ x: label.x, y: label.y, labels: [label] });
    }
  }

  return clusters;
}

function MarkerText({
  text,
  x,
  y,
  rotate,
  transform,
  ...props
}: Omit<React.SVGTextElementAttributes<SVGTextElement>, "children"> & { text: string }) {
  const theme = useTheme();

  const fontSize = 10;
  const lineHeight = fontSize * 1.3;
  const letterWidth = fontSize * 0.3;

  return (
    <text
      fontFamily="monospace"
      fontSize={fontSize}
      fill={theme.constraintColor}
      transform={[`translate(${x} ${y})`, rotate && `rotate(${rotate})`, transform].filter(Boolean).join(" ")}
      {...props}
    >
      {text.split("\n").map((line, i) => (
        <tspan key={i} x={-letterWidth} y={i * lineHeight + lineHeight - fontSize}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function ConstraintsLayer() {
  const theme = useTheme();

  const scale = useEditorStore((s) => s.scale);

  const sketch = useEditorStore((s) => s.sketch);
  const getGeoOf = useEditorStore((s) => s.getGeoOf);

  if (!sketch) return null;

  const labels: TLabel[] = [];

  for (const con of sketch.constraints) {
    if (con.constraint === EConstraint.PointOnCircle) {
      const circle = getGeoOf(EGeo.Circle, con.c_id);
      const c = getGeoOf(EGeo.Point, circle.c_id);
      const p = getGeoOf(EGeo.Point, con.p_id);

      const angle = Math.atan2(c.y[0] - p.y[0], c.x[0] - p.x[0]);
      const dist = 12;

      labels.push({
        con,
        x: p.x[0] * scale + Math.cos(angle) * dist,
        y: p.y[0] * scale + Math.sin(angle) * dist,
      });
    } else if (con.constraint === EConstraint.PointOnLine) {
      const p = getGeoOf(EGeo.Point, con.p_id);
      const segment = getGeoOf(EGeo.Segment, con.l_id);
      const a = getGeoOf(EGeo.Point, segment.a_id);
      const b = getGeoOf(EGeo.Point, segment.b_id);

      const dist = 12;
      const angle = Math.atan2(a.y[0] - b.y[0], a.x[0] - b.x[0]) + Math.PI / 2;

      labels.push({
        con,
        x: p.x[0] * scale + Math.cos(angle) * dist,
        y: p.y[0] * scale + Math.sin(angle) * dist,
      });
    } else if (con.constraint === EConstraint.Perpendicular || con.constraint === EConstraint.Parallel) {
      const sa = getGeoOf(EGeo.Segment, con.a_id);
      const sb = getGeoOf(EGeo.Segment, con.b_id);

      const a1 = getGeoOf(EGeo.Point, sa.a_id);
      const a2 = getGeoOf(EGeo.Point, sa.b_id);
      const b1 = getGeoOf(EGeo.Point, sb.a_id);
      const b2 = getGeoOf(EGeo.Point, sb.b_id);

      const dist = 12;
      const angle1 = Math.atan2(a1.y[0] - a2.y[0], a1.x[0] - a2.x[0]) + Math.PI / 2;
      const angle2 = Math.atan2(b1.y[0] - b2.y[0], b1.x[0] - b2.x[0]) + Math.PI / 2;

      const con1_x = a1.x[0] + (a2.x[0] - a1.x[0]) / 2;
      const con1_y = a1.y[0] + (a2.y[0] - a1.y[0]) / 2;

      const con2_x = b1.x[0] + (b2.x[0] - b1.x[0]) / 2;
      const con2_y = b1.y[0] + (b2.y[0] - b1.y[0]) / 2;

      labels.push(
        {
          con,
          x: con1_x * scale + Math.cos(angle1) * dist,
          y: con1_y * scale + Math.sin(angle1) * dist,
        },
        {
          con,
          x: con2_x * scale + Math.cos(angle2) * dist,
          y: con2_y * scale + Math.sin(angle2) * dist,
        }
      );
    } else if (con.constraint === EConstraint.Vertical) {
      const a = getGeoOf(EGeo.Point, con.a_id);
      const b = getGeoOf(EGeo.Point, con.b_id);

      const dist = 6;

      const dy = b.y[0] - a.y[0];

      const con_x = a.x[0];
      const con_y = a.y[0] + dy / 2;

      labels.push({
        con,
        x: con_x * scale + dist * Math.sign(dy),
        y: con_y * scale,
      });
    } else if (con.constraint === EConstraint.Horizontal) {
      const a = getGeoOf(EGeo.Point, con.a_id);
      const b = getGeoOf(EGeo.Point, con.b_id);

      const dist = 6;

      const dx = b.x[0] - a.x[0];

      const con_x = a.x[0] + dx / 2;
      const con_y = a.y[0];

      labels.push({
        con,
        x: con_x * scale,
        y: con_y * scale + dist * Math.sign(dx),
      });
    }
  }

  const clusters = clusterLabels(labels, 20);

  return (
    <g data-layer="constraints">
      {sketch.constraints
        .filter((c) => c.constraint === EConstraint.Distance)
        .map((c) => {
          const a = getGeoOf(EGeo.Point, c.a_id);
          const b = getGeoOf(EGeo.Point, c.b_id);

          const ax = a.x[0];
          const ay = a.y[0];
          const bx = b.x[0];
          const by = b.y[0];

          const dx = bx - ax;
          const dy = by - ay;

          const angle = (Math.atan2(dy, dx) / Math.PI) * 180;
          const l = Math.sqrt(dx * dx + dy * dy);

          const nx = dx / l;
          const ny = dy / l;

          const d = 40;
          const dt = 6 + d;
          const dl = 8 + d;

          const cx = ax + (bx - ax) / 2;
          const cy = ay + (by - ay) / 2;

          return (
            <Fragment key={c.id}>
              <path
                d={[
                  `M ${ax * scale} ${ay * scale}`,
                  `L ${ax * scale + ny * dl}, ${ay * scale - nx * dl}`,
                  `M ${ax * scale + ny * d}, ${ay * scale - nx * d}`,
                  `L ${bx * scale + ny * d}, ${by * scale - nx * d}`,
                  `M ${bx * scale + ny * dl}, ${by * scale - nx * dl}`,
                  `L ${bx * scale} ${by * scale}`,
                ].join(" ")}
                fill="none"
                stroke={theme.constraintColor}
                strokeWidth={theme.lineWidth}
              />
              <MarkerText
                x={cx * scale + ny * dt}
                y={cy * scale - nx * dt}
                rotate={angle}
                text={c.d.toLocaleString()}
              />
            </Fragment>
          );
        })}
      {sketch.constraints
        .filter((c) => c.constraint === EConstraint.Radius)
        .map((con) => {
          const circle = getGeoOf(EGeo.Circle, con.c_id);
          const c = getGeoOf(EGeo.Point, circle.c_id);

          const angle = 45 * (Math.PI / 180);
          const dist = 12;

          const r = circle.r[0];

          const pcx = (c.x[0] + Math.cos(angle) * r) * scale;
          const pcy = (c.y[0] + Math.sin(angle) * r) * scale;

          return (
            <Fragment key={con.id}>
              <line
                x1={c.x[0] * scale}
                y1={c.y[0] * scale}
                x2={pcx}
                y2={pcy}
                stroke={theme.constraintColor}
                strokeWidth={theme.lineWidth}
              />
              <MarkerText
                x={pcx + Math.cos(angle) * dist}
                y={pcy + Math.sin(angle) * dist}
                text={`R${con.r.toLocaleString()}`}
              />
            </Fragment>
          );
        })}
      {sketch.constraints
        .filter((c) => c.constraint === EConstraint.Angle)
        .map((c) => {
          const A = getGeoOf(EGeo.Segment, c.a_id);
          const B = getGeoOf(EGeo.Segment, c.b_id);

          const a1 = getGeoOf(EGeo.Point, A.a_id);
          const a2 = getGeoOf(EGeo.Point, A.b_id);
          const b1 = getGeoOf(EGeo.Point, B.a_id);
          const b2 = getGeoOf(EGeo.Point, B.b_id);

          const a1x = a1.x[0];
          const a1y = a1.y[0];
          const a2x = a2.x[0];
          const a2y = a2.y[0];
          const b1x = b1.x[0];
          const b1y = b1.y[0];
          const b2x = b2.x[0];
          const b2y = b2.y[0];

          const dxA = a2x - a1x;
          const dyA = a2y - a1y;
          const dxB = b2x - b1x;
          const dyB = b2y - b1y;

          const det = dxB * dyA - dxA * dyB;

          if (Math.abs(det) < 1e-10) return <g key={c.id} data-error="ANGLE_OF_PARALLEL" />;

          const t = (dxB * (b1y - a1y) - (b1x - a1x) * dyB) / det;

          const x = a1x + t * dxA;
          const y = a1y + t * dyA;

          const angle1 = Math.atan2(a2y - y, a2x - x);
          const angle2 = Math.atan2(b2y - y, b2x - x);
          const sweepFlag = angle1 > angle2 ? (angle1 - angle2 > Math.PI ? 1 : 0) : angle2 - angle1 > Math.PI ? 0 : 1;

          const radius = 20;
          const tRadius = 8 + radius;

          return (
            <Fragment key={c.id}>
              <path
                d={[
                  `M ${x * scale} ${y * scale}`,
                  `L ${a1x * scale}, ${a1y * scale}`,
                  `M ${x * scale} ${y * scale}`,
                  `L ${b1x * scale}, ${b1y * scale}`,
                  `M ${x * scale + radius * Math.cos(angle1)} ${y * scale + radius * Math.sin(angle1)}`,
                  `A ${radius} ${radius} 0 0 ${sweepFlag} ${x * scale + radius * Math.cos(angle2)} ${
                    y * scale + radius * Math.sin(angle2)
                  }`,
                ].join(" ")}
                fill="none"
                stroke={theme.constraintColor}
                strokeWidth={theme.lineWidth}
              />
              <MarkerText
                x={x * scale + tRadius * Math.cos((angle1 + angle2) / 2)}
                y={y * scale + tRadius * Math.sin((angle1 + angle2) / 2)}
                text={`${c.a.toLocaleString()}°`}
              />
            </Fragment>
          );
        })}
      {clusters.map((cluster, i) => {
        const byTypeLabels: { [K in EConstraint]?: TLabel<K>[] } = {};

        for (const label of cluster.labels) {
          const list: TLabel[] = (byTypeLabels[label.con.constraint] ??= []);

          list.push(label);
        }

        const text = Object.entries(byTypeLabels)
          .map(([type, labels]) => {
            const char = markerChars[type as EConstraint];

            if (!char) return null;

            return `${char}${
              labels.length > 1 || alwaysWithNumber.has(type as EConstraint)
                ? labels.map((l) => l.con.id).join(",")
                : ""
            }`;
          })
          .join("\n");

        return <MarkerText key={i} text={text} x={cluster.x} y={cluster.y} />;
      })}
    </g>
  );
}

export default ConstraintsLayer;
