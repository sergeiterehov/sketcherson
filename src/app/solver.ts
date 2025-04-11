import {
  TSketch,
  TShape,
  TConstraintDistance,
  EShape,
  TConstraintPerpendicular,
  TConstraintCoincident,
  TConstraintFix,
  EConstraint,
} from "./types";

export function solveConstraints(sketch: TSketch) {
  const damping = 0.1;

  const shapeMap = new Map<number, TShape>();

  for (const shape of sketch.shapes) {
    shapeMap.set(shape.id, shape);
  }

  const solveDistance = (constraint: TConstraintDistance) => {
    const a = shapeMap.get(constraint.a_id);
    const b = shapeMap.get(constraint.b_id);

    if (!a || !b) throw "E_REF";

    if (a.shape === EShape.Point && b.shape === EShape.Point) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // TODO: if dist === 0
      if (dist === 0) return;

      const err = dist - constraint.distance;
      const ratio = err / dist;

      if (Math.abs(err) < 1e-6) return;

      const cx = dx * ratio * 0.5 * damping;
      const cy = dy * ratio * 0.5 * damping;

      a.x += cx;
      a.y += cy;
      b.x -= cx;
      b.y -= cy;
    } else {
      throw "E_SHAPE_TYPE";
    }
  };

  const solvePerpendicular = (constraint: TConstraintPerpendicular) => {
    const a = shapeMap.get(constraint.a_id);
    const b = shapeMap.get(constraint.b_id);

    if (!a || !b) throw "E_REF";
    if (a.shape !== EShape.Segment || b.shape !== EShape.Segment) throw "E_SHAPE_TYPE";

    const A = shapeMap.get(a.a_id);
    const B = shapeMap.get(a.b_id);
    const C = shapeMap.get(b.a_id);
    const D = shapeMap.get(b.b_id);

    if (!A || !B || !C || !D) throw "E_REF";
    if (A.shape !== EShape.Point || B.shape !== EShape.Point || C.shape !== EShape.Point || D.shape !== EShape.Point)
      throw "E_SHAPE_TYPE";

    // Направляющие векторы
    const dx1 = B.x - A.x;
    const dy1 = B.y - A.y;
    const dx2 = D.x - C.x;
    const dy2 = D.y - C.y;

    // Скалярное произведение (ошибка перпендикулярности)
    const err = dx1 * dx2 + dy1 * dy2;

    // Если уже перпендикулярны (error ≈ 0), ничего не делаем
    if (Math.abs(err) < 1e-6) return;

    // Корректируем точки линий, чтобы минимизировать error
    // (используем градиентный спуск)
    const force = err * damping * 0.001;

    // Корректируем все 4 точки (симметрично)

    A.x += dx1 * force * 0.25;
    A.y += dy1 * force * 0.25;

    B.x -= dx2 * force * 0.25;
    B.y -= dy2 * force * 0.25;

    C.x += dx1 * force * 0.25;
    C.y += dy1 * force * 0.25;

    D.x -= dx2 * force * 0.25;
    D.y -= dy2 * force * 0.25;
  };

  const solveCoincident = (constraint: TConstraintCoincident) => {
    const a = shapeMap.get(constraint.a_id);
    const b = shapeMap.get(constraint.b_id);

    if (!a || !b) throw "E_REF";

    if (a.shape !== EShape.Point || b.shape !== EShape.Point) throw "E_SHAPE_TYPE";

    const tx = (a.x + b.x) / 2;
    const ty = (a.y + b.y) / 2;

    const err = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);

    if (Math.abs(err) < 1e-6) return;

    a.x = tx;
    a.y = ty;
    b.x = tx;
    b.y = ty;
  };

  const solveFix = (constraint: TConstraintFix) => {
    const p = shapeMap.get(constraint.p_id);

    if (!p) throw "E_REF";

    if (p.shape !== EShape.Point) throw "E_SHAPE_TYPE";

    p.x = constraint.x;
    p.y = constraint.y;
  };

  for (const constraint of sketch.constraints) {
    if (constraint.constraint === EConstraint.Distance) {
      solveDistance(constraint);
    } else if (constraint.constraint === EConstraint.Perpendicular) {
      solvePerpendicular(constraint);
    } else if (constraint.constraint === EConstraint.Coincident) {
      solveCoincident(constraint);
    } else if (constraint.constraint === EConstraint.Fix) {
      solveFix(constraint);
    }
  }
}
