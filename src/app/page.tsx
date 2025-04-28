"use client";
import { useEffect, useState } from "react";
import { TSketch, EGeo, TGeo } from "./types";
import { sampleSketch } from "./sampleSketch";
import { SketchSolver } from "./solver";

export default function Home() {
  const [viewSize, setViewSize] = useState(() => ({ width: 600, height: 600 }));

  useEffect(
    () =>
      setViewSize({
        width: window.innerWidth,
        height: window.innerHeight,
      }),
    []
  );

  const [iter, setIter] = useState(0);
  const [sketch] = useState<TSketch>(() => JSON.parse(JSON.stringify(sampleSketch)));
  const [solver] = useState(() => new SketchSolver(sketch));

  const handleClick = () => {
    const limit = 1000;

    solver.solve(limit);
    setIter((prev) => prev + limit);
  };

  useEffect(() => {
    const timeout = setInterval(handleClick, 10);

    return () => clearInterval(timeout);
  }, []);

  const geoMap = new Map<number, TGeo>();

  for (const geos of sketch.geos) {
    geoMap.set(geos.id, geos);
  }

  const { width, height } = viewSize;

  const oxColor = "#F008";
  const oyColor = "#0F08";

  const curveColor = "#999";
  const curveWidth = 1;

  const pointColor = "#444";
  const pointRadius = 2;

  return (
    <div onClick={handleClick}>
      <div>Tools: iter={iter}</div>
      <div>
        <svg width={width} height={height}>
          <g transform={`translate(${width / 2},${height / 2})`}>
            {/* basis layer */}
            <line x1={-width} y1={0} x2={width} y2={0} strokeWidth={curveWidth} stroke={oxColor} />
            <line x1={0} y1={-height} x2={0} y2={height} strokeWidth={curveWidth} stroke={oyColor} />
            {/* curves layer */}
            {sketch.geos.map((s) => {
              if (s.geo === EGeo.Segment) {
                const a = geoMap.get(s.a_id);
                const b = geoMap.get(s.b_id);

                if (!a || !b) throw "E_REF";
                if (a.geo !== EGeo.Point || b.geo !== EGeo.Point) throw "E_SHAPE_TYPE";

                return (
                  <line
                    key={s.id}
                    x1={a.x[0]}
                    y1={a.y[0]}
                    x2={b.x[0]}
                    y2={b.y[0]}
                    strokeWidth={curveWidth}
                    stroke={curveColor}
                  />
                );
              } else if (s.geo === EGeo.Circle) {
                const c = geoMap.get(s.c_id);

                if (!c) throw "E_REF";
                if (c.geo !== EGeo.Point) throw "E_SHAPE_TYPE";

                return (
                  <circle
                    key={s.id}
                    cx={c.x[0]}
                    cy={c.y[0]}
                    r={s.r[0]}
                    strokeWidth={curveWidth}
                    stroke={curveColor}
                    fill="none"
                  />
                );
              }
            })}
            {/* points layer */}
            {sketch.geos.map((s) => {
              if (s.geo === EGeo.Point) {
                return <circle key={s.id} cx={s.x[0]} cy={s.y[0]} r={pointRadius} fill={pointColor} />;
              }
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
