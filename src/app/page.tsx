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

  const [sketch, setSketch] = useState<TSketch>(() => JSON.parse(JSON.stringify(sampleSketch)));

  const handleClick = () => {
    const next = { ...sketch };

    const solver = new SketchSolver(next);

    for (let i = 0; i < 1; i += 1) solver.solve();

    setSketch(next);
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

  return (
    <div onClick={handleClick}>
      <div>Tools</div>
      <div>
        <svg width={width} height={height}>
          <g transform={`translate(${width / 2},${height / 2})`}>
            <line x1={-50} y1={0} x2={50} y2={0} strokeWidth="1" stroke="#F008" />
            <line x1={0} y1={-50} x2={0} y2={50} strokeWidth="1" stroke="#0F08" />
            {sketch.geos.map((s) => {
              if (s.geo === EGeo.Point) {
                return <circle key={s.id} cx={s.x[0]} cy={s.y[0]} r={2} fill="blue" />;
              } else if (s.geo === EGeo.Segment) {
                const a = geoMap.get(s.a_id);
                const b = geoMap.get(s.b_id);

                if (!a || !b) throw "E_REF";
                if (a.geo !== EGeo.Point || b.geo !== EGeo.Point) throw "E_SHAPE_TYPE";

                return (
                  <line key={s.id} x1={a.x[0]} y1={a.y[0]} x2={b.x[0]} y2={b.y[0]} strokeWidth="1" stroke="black" />
                );
              } else if (s.geo === EGeo.Circle) {
                const c = geoMap.get(s.c_id);

                if (!c) throw "E_REF";
                if (c.geo !== EGeo.Point) throw "E_SHAPE_TYPE";

                return (
                  <circle key={s.id} cx={c.x[0]} cy={c.y[0]} r={s.r[0]} strokeWidth="1" stroke="black" fill="none" />
                );
              }
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
