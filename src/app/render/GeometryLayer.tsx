import { TID, EGeo, EConstraint } from "@/core/types";
import { Fragment } from "react";
import useEditorStore from "../editorStore";
import useTheme from "../utils/useTheme";

export default function GeometryLayer() {
  const theme = useTheme();

  const scale = useEditorStore((s) => s.scale);
  const sketch = useEditorStore((s) => s.sketch);
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

  const getLineColor = (geoId: TID) => {
    if (selectedGeoIds.includes(geoId)) {
      return theme.selectedColor;
    }

    if (preselectedGeoId === geoId) {
      return theme.preselectedColor;
    }

    return theme.lineColor;
  };

  if (!sketch) return "NO_SKETCH";

  return (
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
  );
}
