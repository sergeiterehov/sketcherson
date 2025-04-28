import {
  TSketch,
  TGeo,
  TConstraintDistance,
  EGeo,
  TConstraintPerpendicular,
  TConstraintCoincident,
  TConstraintFix,
  TConstraintRadius,
  EConstraint,
  TConstraint,
  TParam,
  TConstraintPointOnCircle,
} from "./types";

const ERROR_TOLERANCE = 1e-6;

export class SketchSolver {
  private geoMap = new Map<number, TGeo>();

  private _getGeo<ES extends EGeo[]>(id: number, ...types: ES): TGeo & { geo: ES[number] } {
    const geo = this.geoMap.get(id);

    if (!geo) throw "E_REF";

    if (types.length && !types.includes(geo.geo)) throw "E_GEO_TYPE";

    return geo;
  }

  constructor(public readonly sketch: TSketch, public scale = 0.1) {
    this.update();
  }

  update() {
    const map = this.geoMap;

    map.clear();

    for (const geo of this.sketch.geos) {
      map.set(geo.id, geo);
    }
  }

  solve(iterationsLimit: number = 1): number {
    const params: TParam[] = [];

    for (const constraint of this.sketch.constraints) {
      const constraintParams = this._grubConstraintGeoParams(constraint);

      params.push(...constraintParams);
    }

    const scale = this.scale;
    let err = 0;

    for (let i = 0; i < iterationsLimit; i += 1) {
      for (const param of params) {
        for (const constraint of this.sketch.constraints) {
          const grad = this._grad(constraint, param);
          const diff = grad * scale;

          param[0] += diff;
          err += diff;
        }
      }

      if (err < 1e-6) break;
    }

    return err;
  }

  private _grubConstraintGeoParams(constraint: TConstraint): TParam[] {
    switch (constraint.constraint) {
      case EConstraint.Fix:
        const p = this._getGeo(constraint.p_id, EGeo.Point);
        return [p.x, p.y];
      case EConstraint.Distance:
        const a = this._getGeo(constraint.a_id, EGeo.Point);
        const b = this._getGeo(constraint.b_id, EGeo.Point);
        return [a.x, a.y, b.x, b.y];
      case EConstraint.Perpendicular:
        const A = this._getGeo(constraint.a_id, EGeo.Segment);
        const B = this._getGeo(constraint.b_id, EGeo.Segment);
        const a1 = this._getGeo(A.a_id, EGeo.Point);
        const a2 = this._getGeo(A.b_id, EGeo.Point);
        const b1 = this._getGeo(B.a_id, EGeo.Point);
        const b2 = this._getGeo(B.b_id, EGeo.Point);
        return [a1.x, a1.y, a2.x, a2.y, b1.x, b1.y, b2.x, b2.y];
      case EConstraint.Coincident:
        const pa = this._getGeo(constraint.a_id, EGeo.Point);
        const pb = this._getGeo(constraint.b_id, EGeo.Point);
        return [pa.x, pa.y, pb.x, pb.y];
      case EConstraint.Radius:
        const circle = this._getGeo(constraint.c_id, EGeo.Circle);
        return [circle.r];
      case EConstraint.PointOnCircle:
        const circle2 = this._getGeo(constraint.c_id, EGeo.Circle);
        const center = this._getGeo(circle2.c_id, EGeo.Point);
        const point = this._getGeo(constraint.p_id, EGeo.Point);
        return [circle2.r, center.x, center.y, point.x, point.y];
      default:
        throw "E_UNSUPPORTED_CONSTRAINT";
    }
  }

  private _grad(constraint: TConstraint, param: TParam): number {
    switch (constraint.constraint) {
      case EConstraint.Distance:
        return this._gradDistance(constraint, param);
      case EConstraint.Perpendicular:
        return this._gradPerpendicular(constraint, param);
      case EConstraint.Coincident:
        return this._gradCoincident(constraint, param);
      case EConstraint.Fix:
        return this._gradFix(constraint, param);
      case EConstraint.Radius:
        return this._gradRadius(constraint, param);
      case EConstraint.PointOnCircle:
        return this._gradPointOnCircle(constraint, param);
      default:
        return 0;
    }
  }

  private _gradFix(constraint: TConstraintFix, param: TParam): number {
    const p = this._getGeo(constraint.p_id, EGeo.Point);

    const dx = constraint.x - p.x[0];
    const dy = constraint.y - p.y[0];

    const err = Math.abs(dx) + Math.abs(dy);

    if (Math.abs(err) < ERROR_TOLERANCE) return 0;

    if (param === p.x) return dx;
    if (param === p.y) return dy;

    return 0;
  }

  private _gradDistance(constraint: TConstraintDistance, param: TParam): number {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const dx = a.x[0] - b.x[0];
    const dy = a.y[0] - b.y[0];
    const d = Math.sqrt(dx * dx + dy * dy);

    const err = d - constraint.d;

    if (Math.abs(err) < ERROR_TOLERANCE) return 0;

    const ratio = err / (d || 1);

    if (param === a.x) return -dx * ratio;
    if (param === a.y) return -dy * ratio;
    if (param === b.x) return +dx * ratio;
    if (param === b.y) return +dy * ratio;

    return 0;
  }

  private _gradPerpendicular(constraint: TConstraintPerpendicular, param: TParam): number {
    const a = this._getGeo(constraint.a_id, EGeo.Segment);
    const b = this._getGeo(constraint.b_id, EGeo.Segment);

    const A = this._getGeo(a.a_id, EGeo.Point);
    const B = this._getGeo(a.b_id, EGeo.Point);
    const C = this._getGeo(b.a_id, EGeo.Point);
    const D = this._getGeo(b.b_id, EGeo.Point);

    const dx1 = B.x[0] - A.x[0];
    const dy1 = B.y[0] - A.y[0];
    const dx2 = D.x[0] - C.x[0];
    const dy2 = D.y[0] - C.y[0];

    const err = dx1 * dx2 + dy1 * dy2;

    if (Math.abs(err) < ERROR_TOLERANCE) return 0;

    const force = err * 0.001;

    if (param === A.x) return +dx2 * force;
    if (param === A.y) return +dy2 * force;
    if (param === B.x) return -dx2 * force;
    if (param === B.y) return -dy2 * force;
    if (param === C.x) return +dx1 * force;
    if (param === C.y) return +dy1 * force;
    if (param === D.x) return -dx1 * force;
    if (param === D.y) return -dy1 * force;

    return 0;
  }

  private _gradCoincident(constraint: TConstraintCoincident, param: TParam): number {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const ax = a.x[0];
    const ay = a.y[0];
    const bx = b.x[0];
    const by = b.y[0];

    const dx = ax - bx;
    const dy = ay - by;

    const err = Math.sqrt(dx * dx + dy * dy);

    if (Math.abs(err) < ERROR_TOLERANCE) return 0;

    const tx = (ax + bx) / 2;
    const ty = (ay + by) / 2;

    if (param === a.x) return tx - ax;
    if (param === a.y) return ty - ay;
    if (param === b.x) return tx - bx;
    if (param === b.y) return ty - by;

    return 0;
  }

  private _gradRadius(constraint: TConstraintRadius, param: TParam): number {
    const circle = this._getGeo(constraint.c_id, EGeo.Circle);

    const currentRadius = circle.r[0];
    const targetRadius = constraint.r;

    const err = currentRadius - targetRadius;

    if (Math.abs(err) < ERROR_TOLERANCE) return 0;

    if (param === circle.r) return -err;

    return 0;
  }

  private _gradPointOnCircle(constraint: TConstraintPointOnCircle, param: TParam): number {
    const point = this._getGeo(constraint.p_id, EGeo.Point);
    const circle = this._getGeo(constraint.c_id, EGeo.Circle);
    const center = this._getGeo(circle.c_id, EGeo.Point);

    const px = point.x[0];
    const py = point.y[0];
    const cx = center.x[0];
    const cy = center.y[0];
    const r = circle.r[0];

    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const diff = dist - r;

    const err = -diff;

    if (Math.abs(err) < ERROR_TOLERANCE) return 0;

    const scale = r / dist;
    const ptx = cx + dx * scale;
    const pty = cy + dy * scale;
    const ctx = px - dx * scale;
    const cty = py - dy * scale;

    if (param === point.x) return ptx - px;
    if (param === point.y) return pty - py;
    if (param === center.x) return ctx - cx;
    if (param === center.y) return cty - cy;
    if (param === circle.r) return diff;

    return 0;
  }
}
