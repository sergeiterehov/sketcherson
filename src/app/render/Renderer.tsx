import { Fragment, use, useEffect, useRef } from "react";
import { EConstraint, EGeo } from "@/core/types";
import useEditorStore from "../editorStore";
import ViewportContext from "./ViewportContext";
import ConstraintsLayer from "./ConstraintsLayer";
import useTheme from "../utils/useTheme";
import AxisLayer from "./AxisLayer";

export default function Renderer() {
  const theme = useTheme();

  const svgRef = useRef<SVGSVGElement>(null);

  const { width, height } = use(ViewportContext);
  const scale = useEditorStore((s) => s.scale);
  const translate = useEditorStore((s) => s.translate);
  const mulScale = useEditorStore((s) => s.mulScale);
  const moveTranslate = useEditorStore((s) => s.moveTranslate);

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

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) return;

    const controller = new AbortController();

    svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Проверяем, что это жест масштабирования (обычно с нажатым Ctrl или на трекпаде Mac)
        if (e.ctrlKey || e.metaKey || (e.deltaMode === 0 && Math.abs(e.deltaY) < 1)) {
          // Коэффициент масштабирования (эмпирически подобранный)
          const intensity = 0.01;
          const delta = -e.deltaY;
          const scale = 1 + delta * intensity;

          mulScale(scale);
        } else {
          // Если не масштабирование, то панорамирование
          moveTranslate(-e.deltaX, -e.deltaY);
        }
      },
      { passive: false, signal: controller.signal }
    );

    return () => controller.abort();
  }, [moveTranslate, mulScale, !svgRef.current]);

  if (!sketch) return "NO_SKETCH";

  return (
    <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ userSelect: "none" }}>
      <g transform={`translate(${width / 2 + translate.dx}, ${height / 2 + translate.dy})`}>
        <AxisLayer />
        <ConstraintsLayer />
        {/* Segments */}
        {sketch.geos
          .filter((g) => g.geo === EGeo.Segment)
          .map((geo) => {
            const a = getGeoOf(EGeo.Point, geo.a_id);
            const b = getGeoOf(EGeo.Point, geo.b_id);

            return (
              <Fragment key={geo.id}>
                <line
                  x1={a.x[0] * scale}
                  y1={a.y[0] * scale}
                  x2={b.x[0] * scale}
                  y2={b.y[0] * scale}
                  strokeWidth={theme.lineWidth}
                  stroke={selectedGeoIds.includes(geo.id) ? theme.selectedColor : theme.lineColor}
                  data-geo-id={geo.id}
                  onClick={handleGeoClick}
                />
              </Fragment>
            );
          })}
        {/* Circles */}
        {sketch.geos
          .filter((g) => g.geo === EGeo.Circle)
          .map((geo) => {
            const c = getGeoOf(EGeo.Point, geo.c_id);

            return (
              <Fragment key={geo.id}>
                <circle
                  key={geo.id}
                  cx={c.x[0] * scale}
                  cy={c.y[0] * scale}
                  r={geo.r[0] * scale}
                  strokeWidth={theme.lineWidth}
                  stroke={selectedGeoIds.includes(geo.id) ? theme.selectedColor : theme.lineColor}
                  fill="none"
                  data-geo-id={geo.id}
                  onClick={handleGeoClick}
                />
              </Fragment>
            );
          })}
        {/* Points */}
        {sketch.geos
          .filter((g) => g.geo === EGeo.Point)
          .map((geo) => {
            const constraints = getGeoConstraints(geo.id);

            const selected = selectedGeoIds.includes(geo.id);
            let color = theme.pointColor;

            // Если точка фиксированная или объединенная, то она имеет цвет ограничения
            for (const c of constraints) {
              if (c.constraint === EConstraint.Coincident || c.constraint === EConstraint.Fix) {
                color = theme.constraintColor;
                break;
              }
            }

            if (selected) {
              color = theme.selectedColor;
            }

            const x = geo.x[0];
            const y = geo.y[0];

            return (
              <circle
                key={geo.id}
                cx={x * scale}
                cy={y * scale}
                r={theme.pointRadius}
                fill={color}
                data-geo-id={geo.id}
                onClick={handleGeoClick}
              />
            );
          })}
      </g>
      {/* INFO */}
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
                `R=${paramsOfSelectedGeo.radius.toLocaleString()}, ⵁ${(
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
