import {
  TSketch,
  TShape,
  TConstraintDistance,
  EShape,
  TConstraintPerpendicular,
  TConstraintCoincident,
  TConstraintFix,
  TConstraintRadius,
  EConstraint,
} from "./types";

export class SketchSolver {
  private shapesMap = new Map<number, TShape>();

  constructor(public readonly sketch: TSketch, public damping = 0.1) {
    this.updateShapes();
  }

  public updateShapes() {
    const map = this.shapesMap;

    map.clear();

    for (const shape of this.sketch.shapes) {
      map.set(shape.id, shape);
    }
  }

  solveStep() {
    for (const constraint of this.sketch.constraints) {
      switch (constraint.constraint) {
        case EConstraint.Distance:
          this._solveDistance(constraint);
          break;
        case EConstraint.Perpendicular:
          this._solvePerpendicular(constraint);
          break;
        case EConstraint.Coincident:
          this._solveCoincident(constraint);
          break;
        case EConstraint.Fix:
          this._solveFix(constraint);
          break;
        case EConstraint.Radius:
          this._solveRadius(constraint);
          break;
      }
    }
  }

  private _solveDistance(constraint: TConstraintDistance) {
    const map = this.shapesMap;
    const damping = this.damping;

    const a = map.get(constraint.a_id);
    const b = map.get(constraint.b_id);

    if (!a || !b) throw "E_REF";

    if (a.shape === EShape.Point && b.shape === EShape.Point) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const err = dist - constraint.d;
      const ratio = err / (dist || 1);

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
  }

  private _solvePerpendicular = (constraint: TConstraintPerpendicular) => {
    const map = this.shapesMap;
    const damping = this.damping;

    const a = map.get(constraint.a_id);
    const b = map.get(constraint.b_id);

    if (!a || !b) throw "E_REF";
    if (a.shape !== EShape.Segment || b.shape !== EShape.Segment) throw "E_SHAPE_TYPE";

    const A = map.get(a.a_id);
    const B = map.get(a.b_id);
    const C = map.get(b.a_id);
    const D = map.get(b.b_id);

    if (!A || !B || !C || !D) throw "E_REF";
    if (A.shape !== EShape.Point || B.shape !== EShape.Point || C.shape !== EShape.Point || D.shape !== EShape.Point)
      throw "E_SHAPE_TYPE";

    const dx1 = B.x - A.x;
    const dy1 = B.y - A.y;
    const dx2 = D.x - C.x;
    const dy2 = D.y - C.y;

    const err = dx1 * dx2 + dy1 * dy2;

    if (Math.abs(err) < 1e-6) return;

    const force = err * damping * 0.001;

    A.x += dx1 * force * 0.25;
    A.y += dy1 * force * 0.25;

    B.x -= dx2 * force * 0.25;
    B.y -= dy2 * force * 0.25;

    C.x += dx1 * force * 0.25;
    C.y += dy1 * force * 0.25;

    D.x -= dx2 * force * 0.25;
    D.y -= dy2 * force * 0.25;
  };

  private _solveCoincident(constraint: TConstraintCoincident) {
    const map = this.shapesMap;

    const a = map.get(constraint.a_id);
    const b = map.get(constraint.b_id);

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
  }

  private _solveFix(constraint: TConstraintFix) {
    const map = this.shapesMap;

    const p = map.get(constraint.p_id);

    if (!p) throw "E_REF";

    if (p.shape !== EShape.Point) throw "E_SHAPE_TYPE";

    p.x = constraint.x;
    p.y = constraint.y;
  }

  private _solveRadius(constraint: TConstraintRadius) {
    const map = this.shapesMap;

    const circle = map.get(constraint.c_id);

    if (!circle) throw "E_REF";

    if (circle.shape !== EShape.Circle) throw "E_SHAPE_TYPE";

    const currentRadius = circle.r;
    const targetRadius = constraint.r;

    const err = currentRadius - targetRadius;

    if (Math.abs(err) < 1e-6) return;

    circle.r -= err * this.damping;
  }
}
