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
} from "./types";

export class SketchSolver {
  private geoMap = new Map<number, TGeo>();

  private _getGeo<ES extends EGeo[]>(id: number, ...types: ES): TGeo & { geo: ES[number] } {
    const geo = this.geoMap.get(id);

    if (!geo) throw "E_REF";

    if (types.length && !types.includes(geo.geo)) throw "E_GEO_TYPE";

    return geo;
  }

  constructor(public readonly sketch: TSketch, public damping = 0.1) {
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

    let err = 0;

    // TODO: limit iterations
    for (let i = 0; i < iterationsLimit; i += 1) {
      for (const param of params) {
        for (const constraint of this.sketch.constraints) {
          err += this._grad(constraint, param);
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
        const aCoincident = this._getGeo(constraint.a_id, EGeo.Point);
        const bCoincident = this._getGeo(constraint.b_id, EGeo.Point);
        return [aCoincident.x, aCoincident.y, bCoincident.x, bCoincident.y];
      case EConstraint.Radius:
        const circle = this._getGeo(constraint.c_id, EGeo.Circle);
        return [circle.r];
      default:
        throw "E_UNSUPPORTED_CONSTRAINT";
    }
  }

  private _grad(constraint: TConstraint, param: TParam): number {
    let diff = 0;

    switch (constraint.constraint) {
      case EConstraint.Distance:
        diff = this._gradDistance(constraint, param);
        break;
      case EConstraint.Perpendicular:
        diff = this._gradPerpendicular(constraint, param);
        break;
      case EConstraint.Coincident:
        diff = this._gradCoincident(constraint, param);
        break;
      case EConstraint.Fix:
        diff = this._gradFix(constraint, param);
        break;
      case EConstraint.Radius:
        diff = this._gradRadius(constraint, param);
        break;
    }

    param[0] += diff;

    return diff;
  }

  private _gradFix(constraint: TConstraintFix, param: TParam): number {
    const p = this._getGeo(constraint.p_id, EGeo.Point);

    const dx = constraint.x - p.x[0];
    const dy = constraint.y - p.y[0];

    const err = Math.abs(dx) + Math.abs(dy);

    if (Math.abs(err) < 1e-6) return 0;

    const damping = this.damping;

    if (param === p.x) return dx * damping;
    if (param === p.y) return dy * damping;

    return 0;
  }

  private _gradDistance(constraint: TConstraintDistance, param: TParam): number {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const dx = b.x[0] - a.x[0];
    const dy = b.y[0] - a.y[0];
    const dist = Math.sqrt(dx * dx + dy * dy);

    const err = dist - constraint.d;
    const ratio = err / (dist || 1);

    if (Math.abs(err) < 1e-6) return 0;

    const damping = this.damping;

    const cx = dx * ratio * 0.5 * damping;
    const cy = dy * ratio * 0.5 * damping;

    if (param === a.x) return +cx;
    if (param === a.y) return +cy;
    if (param === b.x) return -cx;
    if (param === b.y) return -cy;

    return 0;
  }

  private _gradPerpendicular(constraint: TConstraintPerpendicular, param: TParam): number {
    const damping = this.damping;

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

    if (Math.abs(err) < 1e-6) return 0;

    const force = err * damping * 0.001;

    if (param === A.x) return +dx1 * force;
    if (param === A.y) return +dy1 * force;
    if (param === B.x) return -dx2 * force;
    if (param === B.y) return -dy2 * force;
    if (param === C.x) return +dx1 * force;
    if (param === C.y) return +dy1 * force;
    if (param === D.x) return -dx2 * force;
    if (param === D.y) return -dy2 * force;

    return 0;
  }

  private _gradCoincident(constraint: TConstraintCoincident, param: TParam): number {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const ax = a.x[0];
    const ay = a.y[0];
    const bx = b.x[0];
    const by = b.y[0];

    const tx = (ax + bx) / 2;
    const ty = (ay + by) / 2;

    const err = Math.abs(bx - ax) + Math.abs(by - ay);

    if (Math.abs(err) < 1e-6) return 0;

    const damping = this.damping;

    if (param === a.x) return (tx - ax) * damping;
    if (param === a.y) return (ty - ay) * damping;
    if (param === b.x) return (tx - bx) * damping;
    if (param === b.y) return (ty - by) * damping;

    return 0;
  }

  private _gradRadius(constraint: TConstraintRadius, param: TParam): number {
    const circle = this._getGeo(constraint.c_id, EGeo.Circle);

    const currentRadius = circle.r[0];
    const targetRadius = constraint.r;

    const err = currentRadius - targetRadius;

    if (Math.abs(err) < 1e-6) return 0;

    if (param === circle.r) return -err * this.damping;

    return 0;
  }
}
