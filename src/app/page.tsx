"use client";
import { useEffect, useState } from "react";
import { TSketch, EShape, TShape } from "./types";
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

    for (let i = 0; i < 1000; i += 1) solver.solveStep();
    setSketch(next);
  };

  useEffect(() => {
    const timeout = setInterval(handleClick, 10);

    return () => clearInterval(timeout);
  }, []);

  const shapeMap = new Map<number, TShape>();

  for (const shape of sketch.shapes) {
    shapeMap.set(shape.id, shape);
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
            {sketch.shapes.map((s) => {
              if (s.shape === EShape.Point) {
                return <circle key={s.id} cx={s.x} cy={s.y} r={2} fill="blue" />;
              } else if (s.shape === EShape.Segment) {
                const a = shapeMap.get(s.a_id);
                const b = shapeMap.get(s.b_id);

                if (!a || !b) throw "E_REF";
                if (a.shape !== EShape.Point || b.shape !== EShape.Point) throw "E_SHAPE_TYPE";

                return <line key={s.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth="1" stroke="black" />;
              } else if (s.shape === EShape.Circle) {
                const c = shapeMap.get(s.c_id);

                if (!c) throw "E_REF";
                if (c.shape !== EShape.Point) throw "E_SHAPE_TYPE";

                return <circle key={s.id} cx={c.x} cy={c.y} r={s.r} strokeWidth="1" stroke="black" fill="none" />;
              }
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
