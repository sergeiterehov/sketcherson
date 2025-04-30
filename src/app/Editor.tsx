"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKey, useWindowSize } from "react-use";
import { TSketch, EGeo, TGeo, TID } from "./types";
import { sampleSketch } from "./sampleSketch";
import { SketchSolver } from "./solver";
import { TollBar, ToolBarButton } from "@/components/toolbar";
import { makeCoincident, makePointOnCircle, makePointOnLine } from "./utils";

export default function Editor() {
  const viewSize = useWindowSize();

  const [scale] = useState(1);

  const [stat, setStat] = useState({ error: 0, lambda: 0, i: 0 });
  const [sketch] = useState<TSketch>(() => JSON.parse(JSON.stringify(sampleSketch)));
  const [solver] = useState(() => new SketchSolver(sketch));

  const [geoMap] = useState(() => new Map<number, TGeo>());

  geoMap.clear();

  for (const geos of sketch.geos) {
    geoMap.set(geos.id, geos);
  }

  const [selectedGeoIds, setSelectedGeoIds] = useState<TID[]>([]);
  const selectedGeos = useMemo(() => selectedGeoIds.map((id) => geoMap.get(id)!), [geoMap, selectedGeoIds]);

  const solvingControllerRef = useRef<AbortController>(null);

  const solve = useCallback(() => {
    if (solvingControllerRef.current) {
      solvingControllerRef.current.abort();
    }

    solvingControllerRef.current = new AbortController();

    const frameTime = 16;

    const solving = solver.solve({ rollbackOnError: false, iterationsLimit: 10_000_000, logDivider: 20_000 });

    let prevStepAt = 0;
    let animRequest = 0;

    const loop = () => {
      animRequest = requestAnimationFrame(loop);

      const now = Date.now();

      if (now - prevStepAt < frameTime) return;

      prevStepAt = now;

      try {
        const { done, value } = solving.next();

        if (done) {
          setStat({ error: 0, i: 0, lambda: 0 });
          return;
        }

        setStat(value);
      } catch (e) {
        setStat({ error: -1, i: 0, lambda: 0 });
        console.error("Solving error:", e);
      }
    };

    loop();

    solvingControllerRef.current.signal.addEventListener("abort", () => {
      cancelAnimationFrame(animRequest);
      solving.return();
    });
  }, [solver]);

  const handleGeoClick = useCallback((e: React.MouseEvent<SVGElement>) => {
    const id = Number(e.currentTarget.dataset.geoId);

    if (Number.isNaN(id)) return;

    setSelectedGeoIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((iid) => iid !== id);
      }

      return [...prev, id];
    });
  }, []);

  const allowCoincident = useMemo(() => {
    if (selectedGeos.length < 2) return false;

    return selectedGeos.every((g) => g.geo === EGeo.Point);
  }, [selectedGeos]);
  const handleCoincidentClick = useCallback(() => {
    if (selectedGeos.length < 2) return;

    const [target, ...sources] = selectedGeos;

    if (target.geo !== EGeo.Point) return;

    for (const source of sources) {
      if (source.geo !== EGeo.Point) continue;

      makeCoincident(sketch, target, source);
    }

    setSelectedGeoIds([]);

    solve();
  }, [selectedGeos, sketch, solve]);
  useKey("x", handleCoincidentClick, {}, [handleCoincidentClick]);

  const allowPointOnLine = useMemo(() => {
    if (selectedGeos.length < 2) return false;

    let lines = 0;
    let points = 0;

    for (const geo of selectedGeos) {
      if (geo.geo === EGeo.Segment) {
        lines += 1;
      } else if (geo.geo === EGeo.Point) {
        points += 1;
      }

      if (lines > 1) return false;
    }

    if (!lines || !points) return false;

    return true;
  }, [selectedGeos]);
  const handlePointOnLineClick = useCallback(() => {
    if (selectedGeos.length < 2) return;

    const line = selectedGeos.find((g) => g.geo === EGeo.Segment);

    if (!line) return;

    for (const geo of selectedGeos) {
      if (geo.geo !== EGeo.Point) continue;

      makePointOnLine(sketch, geo, line);
    }

    setSelectedGeoIds([]);

    solve();
  }, [selectedGeos, sketch, solve]);
  useKey("l", handlePointOnLineClick, {}, [handlePointOnLineClick]);

  const allowPointOnCircle = useMemo(() => {
    if (selectedGeos.length < 2) return false;

    let circles = 0;
    let points = 0;

    for (const geo of selectedGeos) {
      if (geo.geo === EGeo.Circle) {
        circles += 1;
      } else if (geo.geo === EGeo.Point) {
        points += 1;
      }

      if (circles > 1) return false;
    }

    if (!circles || !points) return false;

    return true;
  }, [selectedGeos]);
  const handlePointOnCircleClick = useCallback(() => {
    if (selectedGeos.length < 2) return;

    const circle = selectedGeos.find((g) => g.geo === EGeo.Circle);

    if (!circle) return;

    for (const geo of selectedGeos) {
      if (geo.geo !== EGeo.Point) continue;

      makePointOnCircle(sketch, geo, circle);
    }

    setSelectedGeoIds([]);

    solve();
  }, [selectedGeos, sketch, solve]);
  useKey("q", handlePointOnCircleClick, {}, [handlePointOnCircleClick]);

  useEffect(() => {
    solve();

    return () => solvingControllerRef.current?.abort();
  }, [solve]);

  const { width, height } = viewSize;

  const oxColor = "#F008";
  const oyColor = "#0F08";

  const selectedColor = "#08F";

  const curveColor = "#999";
  const curveWidth = 1;

  const pointColor = "#444";
  const pointRadius = 2;

  return (
    <div className="Editor">
      <TollBar>
        <ToolBarButton aria-disabled={!allowCoincident} title="Coincident [X]" onClick={handleCoincidentClick}>
          X
        </ToolBarButton>
        <ToolBarButton aria-disabled={!allowPointOnLine} title="Point on line [L]" onClick={handlePointOnLineClick}>
          L
        </ToolBarButton>
        <ToolBarButton
          aria-disabled={!allowPointOnCircle}
          title="Point on circle [Q]"
          onClick={handlePointOnCircleClick}
        >
          Q
        </ToolBarButton>
      </TollBar>
      <div>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${width / 2},${height / 2})`}>
            {/* basis layer */}
            <line x1={-width} y1={0} x2={width} y2={0} strokeWidth={curveWidth} stroke={oxColor} />
            <line x1={0} y1={-height} x2={0} y2={height} strokeWidth={curveWidth} stroke={oyColor} />
            {/* curves layer */}
            {sketch.geos.map((s) => {
              if (s.geo === EGeo.Segment) {
                const a = geoMap.get(s.a_id);
                const b = geoMap.get(s.b_id);

                if (!a || !b) throw new Error("E_REF");
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
                const c = geoMap.get(s.c_id);

                if (!c) throw new Error("E_REF");
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
              <tspan x="0" dy="1.2em">
                e={stat.error.toLocaleString()}
              </tspan>
              <tspan x="0" dy="1.2em">
                l={stat.lambda.toLocaleString()}
              </tspan>
              <tspan x="0" dy="1.2em">
                Selection: {selectedGeoIds.join(", ") || "-"}
              </tspan>
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
