import useEditorStore from "./editorStore";
import { EGeo } from "./types";

const oxColor = "#F008";
const oyColor = "#0F08";

const selectedColor = "#F00";

const curveColor = "#999";
const curveWidth = 1;

const pointColor = "#444";
const pointRadius = 2;

export default function SketchSvg(props: { width: number; height: number }) {
  const { width, height } = props;

  const scale = useEditorStore((s) => s.scale);

  const sketch = useEditorStore((s) => s.sketch);
  const stat = useEditorStore((s) => s.solvingStats);
  const paramsOfSelectedGeo = useEditorStore((s) => s.paramsOfSelectedGeo);
  const selectedGeoIds = useEditorStore((s) => s.selectedGeoIds);
  const toggleGeoSelection = useEditorStore((s) => s.toggleGeoSelection);
  const getGeo = useEditorStore((s) => s.getGeo);

  const handleGeoClick = (e: React.MouseEvent<SVGElement>) => {
    const id = Number(e.currentTarget.dataset.geoId);

    if (Number.isNaN(id)) return;

    toggleGeoSelection(id);
  };

  if (!sketch) return "NO_SKETCH";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g transform={`translate(${width / 2},${height / 2})`}>
        {/* basis layer */}
        <line x1={-width} y1={0} x2={width} y2={0} strokeWidth={curveWidth} stroke={oxColor} />
        <line x1={0} y1={-height} x2={0} y2={height} strokeWidth={curveWidth} stroke={oyColor} />
        {/* curves layer */}
        {sketch.geos.map((s) => {
          if (s.geo === EGeo.Segment) {
            const a = getGeo(s.a_id);
            const b = getGeo(s.b_id);

            if (a.geo !== EGeo.Point || b.geo !== EGeo.Point) throw new Error("E_SHAPE_TYPE");

            return (
              <line
                key={s.id}
                x1={a.x[0] * scale}
                y1={a.y[0] * scale}
                x2={b.x[0] * scale}
                y2={b.y[0] * scale}
                strokeWidth={curveWidth}
                stroke={selectedGeoIds.includes(s.id) ? selectedColor : curveColor}
                data-geo-id={s.id}
                onClick={handleGeoClick}
              />
            );
          } else if (s.geo === EGeo.Circle) {
            const c = getGeo(s.c_id);

            if (c.geo !== EGeo.Point) throw new Error("E_SHAPE_TYPE");

            return (
              <circle
                key={s.id}
                cx={c.x[0] * scale}
                cy={c.y[0] * scale}
                r={s.r[0] * scale}
                strokeWidth={curveWidth}
                stroke={selectedGeoIds.includes(s.id) ? selectedColor : curveColor}
                fill="none"
                data-geo-id={s.id}
                onClick={handleGeoClick}
              />
            );
          }
        })}
        {/* points layer */}
        {sketch.geos.map((s) => {
          if (s.geo === EGeo.Point) {
            return (
              <circle
                key={s.id}
                cx={s.x[0] * scale}
                cy={s.y[0] * scale}
                r={pointRadius}
                fill={selectedGeoIds.includes(s.id) ? selectedColor : pointColor}
                data-geo-id={s.id}
                onClick={handleGeoClick}
              />
            );
          }
        })}
      </g>
      <g>
        <text x={0} y={0} fontFamily="monospace">
          <tspan x="0" dy="1.2em">
            i={stat.i.toLocaleString()}
          </tspan>
          <tspan dx="24px">
            e={stat.error.toLocaleString()}
          </tspan>
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
