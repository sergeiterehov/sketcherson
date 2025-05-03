import { Fragment, use, useEffect, useRef } from "react";
import { EConstraint, EGeo, TID } from "@/core/types";
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
  const pointer = useEditorStore((s) => s.pointer);

  const sketch = useEditorStore((s) => s.sketch);
  const stat = useEditorStore((s) => s.solvingStats);
  const paramsOfSelectedGeo = useEditorStore((s) => s.paramsOfSelectedGeo);
  const selectedGeoIds = useEditorStore((s) => s.selectedGeoIds);
  const preselectedGeoId = useEditorStore((s) => s.preselectedGeoId);
  const toggleGeoSelection = useEditorStore((s) => s.toggleGeoSelection);
  const setPreselectedGeo = useEditorStore((s) => s.setPreselectedGeo);
  const getGeoOf = useEditorStore((s) => s.getGeoOf);

  const handleGeoMouseEnter = (e: React.MouseEvent<SVGElement>) => {
    const id = Number(e.currentTarget.dataset.geoId);

    if (Number.isNaN(id)) return;

    setPreselectedGeo(id);
  };

  const handleGeoMouseLeave = (e: React.MouseEvent<SVGElement>) => {
    const id = Number(e.currentTarget.dataset.geoId);

    if (Number.isNaN(id)) return;

    setPreselectedGeo(undefined);
  };

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
      (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const { setScale, moveTranslate, scale } = useEditorStore.getState();

        // Проверяем, что это жест масштабирования (обычно с нажатым Ctrl или на трекпаде Mac)
        if (e.ctrlKey || e.metaKey || (e.deltaMode === 0 && Math.abs(e.deltaY) < 1)) {
          // Коэффициент масштабирования (эмпирически подобранный)
          const intensity = 0.01;
          const delta = -e.deltaY;
          const scaleFactor = 1 + delta * intensity;
          const newScale = scale * scaleFactor;

          const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();

          const sx = e.clientX - box.x - svg.clientWidth / 2;
          const sy = e.clientY - box.y - svg.clientHeight / 2;

          setScale(newScale);
          moveTranslate(sx / newScale - sx / scale, sy / newScale - sy / scale);
        } else {
          // Если не масштабирование, то панорамирование
          moveTranslate(-e.deltaX / scale, -e.deltaY / scale);
        }
      },
      { passive: false, signal: controller.signal }
    );

    svg.addEventListener(
      "mousemove",
      (e: MouseEvent) => {
        const { scale, translate, setPointer } = useEditorStore.getState();

        const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();

        const x = (e.clientX - box.x - svg.clientWidth / 2) / scale - translate.dx;
        const y = (e.clientY - box.y - svg.clientHeight / 2) / scale - translate.dy;

        setPointer(x, y);
      },
      { signal: controller.signal }
    );

    return () => controller.abort();
  }, [!svgRef.current]);

  if (!sketch) return "NO_SKETCH";

  const getLineColor = (geoId: TID) => {
    if (selectedGeoIds.includes(geoId)) {
      return theme.selectedColor;
    }

    if (preselectedGeoId === geoId) {
      return theme.preselectedColor;
    }

    return theme.lineColor;
  };

  return (
    <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ userSelect: "none" }}>
      <g
        data-layer="space"
        transform={`translate(${width / 2 + translate.dx * scale}, ${height / 2 + translate.dy * scale})`}
      >
        <AxisLayer />
        <ConstraintsLayer />
        <g data-layer="geometry">
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
                    stroke={getLineColor(geo.id)}
                  />
                  <line
                    x1={a.x[0] * scale}
                    y1={a.y[0] * scale}
                    x2={b.x[0] * scale}
                    y2={b.y[0] * scale}
                    strokeWidth={theme.interactiveStrokeWidth}
                    stroke={theme.hitColor}
                    data-geo-id={geo.id}
                    onClick={handleGeoClick}
                    onMouseEnter={handleGeoMouseEnter}
                    onMouseLeave={handleGeoMouseLeave}
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
                    cx={c.x[0] * scale}
                    cy={c.y[0] * scale}
                    r={geo.r[0] * scale}
                    strokeWidth={theme.lineWidth}
                    stroke={getLineColor(geo.id)}
                    fill="none"
                  />
                  <circle
                    cx={c.x[0] * scale}
                    cy={c.y[0] * scale}
                    r={geo.r[0] * scale}
                    strokeWidth={theme.interactiveStrokeWidth}
                    stroke={theme.hitColor}
                    fill="none"
                    data-geo-id={geo.id}
                    onClick={handleGeoClick}
                    onMouseEnter={handleGeoMouseEnter}
                    onMouseLeave={handleGeoMouseLeave}
                  />
                </Fragment>
              );
            })}
          {/* Points */}
          {sketch.geos
            .filter((g) => g.geo === EGeo.Point)
            .map((geo) => {
              let color = theme.pointColor;

              // Если точка фиксированная или объединенная, то она имеет цвет ограничения
              for (const c of sketch.constraints) {
                if (
                  (c.constraint === EConstraint.Coincident && (c.a_id === geo.id || c.b_id === geo.id)) ||
                  (c.constraint === EConstraint.Fix && c.p_id === geo.id)
                ) {
                  color = theme.constraintColor;
                  break;
                }
              }

              if (preselectedGeoId === geo.id) {
                color = theme.preselectedColor;
              } else if (selectedGeoIds.includes(geo.id)) {
                color = theme.selectedColor;
              }

              const x = geo.x[0];
              const y = geo.y[0];

              return (
                <Fragment key={geo.id}>
                  <circle cx={x * scale} cy={y * scale} r={theme.pointRadius} fill={color} />
                  <circle
                    cx={x * scale}
                    cy={y * scale}
                    r={theme.interactivePointRadius}
                    fill={theme.hitColor}
                    data-geo-id={geo.id}
                    onClick={handleGeoClick}
                    onMouseEnter={handleGeoMouseEnter}
                    onMouseLeave={handleGeoMouseLeave}
                  />
                </Fragment>
              );
            })}
        </g>
      </g>
      {/* INFO */}
      <g data-layer="info">
        <text x={0} y={0} fontFamily="monospace">
          <tspan x="0" dy="1.2em">
            i={stat.i.toLocaleString()}
          </tspan>
          <tspan dx="24px">e={stat.error.toLocaleString()}</tspan>
          <tspan x="0" dy="1.2em">
            Position: ({pointer.x.toLocaleString()}, {pointer.y.toLocaleString()})
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
