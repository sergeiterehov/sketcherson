import { Fragment } from "react";
import useEditorStore from "./editorStore";
import { EConstraint, EGeo, TConstraint } from "./types";

const oxColor = "#F008";
const oyColor = "#0F08";

const selectedColor = "#F00";

const curveColor = "#999";
const curveWidth = 1;

const pointColor = "#444";
const pointRadius = 2;

const constraintColor = "#A00";

function stringifyConstraints(constraints: TConstraint[]): string {
  const perpendiculars: (TConstraint & { constraint: EConstraint.Perpendicular })[] = [];

  for (const c of constraints) {
    if (c.constraint === EConstraint.Perpendicular) {
      perpendiculars.push(c);
    }
  }

  return [perpendiculars.length ? "T" + perpendiculars.map((c) => c.id).join(",") : null].filter(Boolean).join("\n");
}

function GeoConstraintsText(props: { x: number; y: number; constraints: TConstraint[] }) {
  const { constraints, x, y } = props;

  const text = stringifyConstraints(constraints);

  if (!text) return null;

  return (
    <text x={x} y={y} fill={constraintColor} fontFamily="monospace" fontSize={10}>
      {text.split("\n").map((str, i) => (
        <tspan key={i} dy="1.2em">
          {str}
        </tspan>
      ))}
    </text>
  );
}

export default function SketchSvg(props: { width: number; height: number }) {
  const { width, height } = props;

  const scale = useEditorStore((s) => s.scale);

  const sketch = useEditorStore((s) => s.sketch);
  const stat = useEditorStore((s) => s.solvingStats);
  const paramsOfSelectedGeo = useEditorStore((s) => s.paramsOfSelectedGeo);
  const selectedGeoIds = useEditorStore((s) => s.selectedGeoIds);
  const toggleGeoSelection = useEditorStore((s) => s.toggleGeoSelection);
  const getGeoOf = useEditorStore((s) => s.getGeoOf);
  const getGeoConstraints = useEditorStore((s) => s.getGeoConstraints);

  const handleGeoClick = (e: React.MouseEvent<SVGElement>) => {
    const id = Number(e.currentTarget.dataset.geoId);

    if (Number.isNaN(id)) return;

    toggleGeoSelection(id);
  };

  if (!sketch) return "NO_SKETCH";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ userSelect: "none" }}>
      <g transform={`translate(${width / 2},${height / 2})`}>
        {/* basis layer */}
        <line x1={-width} y1={0} x2={width} y2={0} strokeWidth={curveWidth} stroke={oxColor} />
        <line x1={0} y1={-height} x2={0} y2={height} strokeWidth={curveWidth} stroke={oyColor} />
        {/* curves layer */}
        {sketch.geos
          .filter((g) => g.geo === EGeo.Segment)
          .map((geo) => {
            const a = getGeoOf(EGeo.Point, geo.a_id);
            const b = getGeoOf(EGeo.Point, geo.b_id);

            const constraints = getGeoConstraints(geo.id);

            const con_x = a.x[0] + (b.x[0] - a.x[0]) / 2;
            const con_y = a.y[0] + (b.y[0] - a.y[0]) / 2;

            return (
              <Fragment key={geo.id}>
                <line
                  x1={a.x[0] * scale}
                  y1={a.y[0] * scale}
                  x2={b.x[0] * scale}
                  y2={b.y[0] * scale}
                  strokeWidth={curveWidth}
                  stroke={selectedGeoIds.includes(geo.id) ? selectedColor : curveColor}
                  data-geo-id={geo.id}
                  onClick={handleGeoClick}
                />
                <GeoConstraintsText x={con_x * scale} y={con_y * scale} constraints={constraints} />
              </Fragment>
            );
          })}
        {sketch.geos
          .filter((g) => g.geo === EGeo.Circle)
          .map((geo) => {
            const c = getGeoOf(EGeo.Point, geo.c_id);

            const constraints = getGeoConstraints(geo.id);

            const con_x = c.x[0] + geo.r[0];
            const con_y = c.y[0] - geo.r[0];

            return (
              <Fragment key={geo.id}>
                <circle
                  key={geo.id}
                  cx={c.x[0] * scale}
                  cy={c.y[0] * scale}
                  r={geo.r[0] * scale}
                  strokeWidth={curveWidth}
                  stroke={selectedGeoIds.includes(geo.id) ? selectedColor : curveColor}
                  fill="none"
                  data-geo-id={geo.id}
                  onClick={handleGeoClick}
                />
                {constraints
                  .filter((c) => c.constraint === EConstraint.PointOnCircle)
                  .map((con) => {
                    const p = getGeoOf(EGeo.Point, con.p_id);

                    const angle = Math.atan2(c.y[0] - p.y[0], c.x[0] - p.x[0]);
                    const dist = 12;

                    return (
                      <text
                        key={con.id}
                        x={(p.x[0] + Math.cos(angle) * dist) * scale}
                        y={(p.y[0] + Math.sin(angle) * dist) * scale}
                        fontFamily="monospace"
                        fontSize={10}
                        fill={constraintColor}
                      >
                        Q
                      </text>
                    );
                  })}
                <GeoConstraintsText x={con_x * scale} y={con_y * scale} constraints={constraints} />
              </Fragment>
            );
          })}
        {/* points layer */}
        {sketch.geos
          .filter((g) => g.geo === EGeo.Point)
          .map((geo) => {
            const constraints = getGeoConstraints(geo.id);

            const selected = selectedGeoIds.includes(geo.id);
            let color = pointColor;

            // Если точка фиксированная или объединенная, то она имеет цвет ограничения
            for (const c of constraints) {
              if (c.constraint === EConstraint.Coincident || c.constraint === EConstraint.Fix) {
                color = constraintColor;
                break;
              }
            }

            if (selected) {
              color = selectedColor;
            }

            const x = geo.x[0];
            const y = geo.y[0];

            return (
              <circle
                key={geo.id}
                cx={x * scale}
                cy={y * scale}
                r={pointRadius}
                fill={color}
                data-geo-id={geo.id}
                onClick={handleGeoClick}
              />
            );
          })}
      </g>
      <g>
        <text x={0} y={0} fontFamily="monospace">
          <tspan x="0" dy="1.2em">
            i={stat.i.toLocaleString()}
          </tspan>
          <tspan dx="24px">e={stat.error.toLocaleString()}</tspan>
          <tspan x="0" dy="1.2em">
            Selection: {selectedGeoIds.join(", ") || "-"}
          </tspan>
          <tspan x="0" dy="1.2em">
            Params:{" "}
            {[
              paramsOfSelectedGeo.length !== undefined && `Length=${paramsOfSelectedGeo.length.toLocaleString()}`,
              paramsOfSelectedGeo.distance !== undefined && `Distance=${paramsOfSelectedGeo.distance.toLocaleString()}`,
              paramsOfSelectedGeo.radius !== undefined &&
                `Radius=${paramsOfSelectedGeo.radius.toLocaleString()}, D=${(
                  paramsOfSelectedGeo.radius * 2
                ).toLocaleString()}`,
            ]
              .filter(Boolean)
              .join("; ") || "-"}
          </tspan>
        </text>
      </g>
    </svg>
  );
}
