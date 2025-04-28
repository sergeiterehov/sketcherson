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

const ERROR_TOLERANCE = 1e-5;

export class SketchSolver {
  private geoMap = new Map<number, TGeo>();

  private _getGeo<ES extends EGeo[]>(id: number, ...types: ES): TGeo & { geo: ES[number] } {
    const geo = this.geoMap.get(id);

    if (!geo) throw "E_REF";

    if (types.length && !types.includes(geo.geo)) throw "E_GEO_TYPE";

    return geo;
  }

  constructor(public readonly sketch: TSketch) {
    this.update();
  }

  update() {
    const map = this.geoMap;

    map.clear();

    for (const geo of this.sketch.geos) {
      map.set(geo.id, geo);
    }
  }

  *solve(config: {
    iterationsLimit?: number;
    logDivider?: number;
    timeLimit?: number;
  }): Generator<{ error: number; lambda: number; i: number }, void> {
    const { iterationsLimit = 1_000, logDivider, timeLimit } = config;
    const statedAt = Date.now();

    const params: TParam[] = [];

    for (const constraint of this.sketch.constraints) {
      const constraintParams = this._grubConstraintGeoParams(constraint);

      params.push(...constraintParams);
    }

    // Градиентный спуск ошибки с адаптивным шагом

    const factor = 2;

    let lambda = 0.001;
    let error = 0;

    for (const constraint of this.sketch.constraints) {
      error += this._error(constraint);
    }

    const backup: number[] = new Array(params.length);

    for (let i = 1; i <= iterationsLimit; i += 1) {
      // Логирование для отладки
      if (logDivider && i % logDivider === 0) yield { error, lambda, i };

      // Прерывание по таймауту
      if (timeLimit && i % 100 === 0 && Date.now() - statedAt > timeLimit) break;

      // Останавливаемся, если ошибка достигла минимума
      if (error < ERROR_TOLERANCE) break;

      // Крайние значения, из которых не выбраться
      if (lambda === Infinity || lambda === 0) break;

      // Сохраняем значения параметров для отката
      for (let pi = params.length - 1; pi >= 0; pi -= 1) {
        backup[pi] = params[pi][0];
      }

      // Обновляем параметры градиентным спуском ошибки
      for (const param of params) {
        let grad = 0;

        for (const constraint of this.sketch.constraints) {
          grad += this._grad(constraint, param);
        }

        param[0] -= grad / (lambda + Math.abs(grad));
      }

      // Корректируем настройки, если ошибка растет
      let stepError = 0;

      for (const constraint of this.sketch.constraints) {
        stepError += this._error(constraint);
      }

      if (stepError < error) {
        lambda /= factor;
        error = stepError;
      } else {
        lambda *= factor;

        // Откат неудачных изменений
        for (let pi = params.length - 1; pi >= 0; pi -= 1) {
          params[pi][0] = backup[pi];
        }
      }
    }
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

  private _error(constraint: TConstraint): number {
    switch (constraint.constraint) {
      case EConstraint.Fix:
        return this._errorFix(constraint);
      case EConstraint.Distance:
        return this._errorDistance(constraint);
      case EConstraint.Perpendicular:
        return this._errorPerpendicular(constraint);
      case EConstraint.Coincident:
        return this._errorCoincident(constraint);
      case EConstraint.Radius:
        return this._errorRadius(constraint);
      case EConstraint.PointOnCircle:
        return this._errorPointOnCircle(constraint);
      default:
        return 0;
    }
  }

  private _grad(constraint: TConstraint, param: TParam): number {
    switch (constraint.constraint) {
      case EConstraint.Fix:
        return this._gradFix(constraint, param);
      case EConstraint.Distance:
        return this._gradDistance(constraint, param);
      case EConstraint.Perpendicular:
        return this._gradPerpendicular(constraint, param);
      case EConstraint.Coincident:
        return this._gradCoincident(constraint, param);
      case EConstraint.Radius:
        return this._gradRadius(constraint, param);
      case EConstraint.PointOnCircle:
        return this._gradPointOnCircle(constraint, param);
      default:
        return 0;
    }
  }

  private _errorFix(constraint: TConstraintFix): number {
    const p = this._getGeo(constraint.p_id, EGeo.Point);

    const dx = p.x[0] - constraint.x;
    const dy = p.y[0] - constraint.y;

    const err = dx * dx + dy * dy;

    return err;
  }

  private _gradFix(constraint: TConstraintFix, param: TParam): number {
    const p = this._getGeo(constraint.p_id, EGeo.Point);

    const ax = p.x[0];
    const ay = p.y[0];

    const dx = 2 * (ax - constraint.x);
    const dy = 2 * (ay - constraint.y);

    if (param === p.x) return +dx;
    if (param === p.y) return +dy;

    return 0;
  }

  private _errorDistance(constraint: TConstraintDistance): number {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const dx = a.x[0] - b.x[0];
    const dy = a.y[0] - b.y[0];
    const d = Math.sqrt(dx * dx + dy * dy);

    const err = (d - constraint.d) ** 2;

    return err;
  }

  private _gradDistance(constraint: TConstraintDistance, param: TParam): number {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const dx = b.x[0] - a.x[0];
    const dy = b.y[0] - a.y[0];

    const d = Math.sqrt(dx * dx + dy * dy);

    const dErr = (2 * (d - constraint.d)) / Math.max(ERROR_TOLERANCE, d);

    if (param === a.x) return -dx * dErr;
    if (param === a.y) return -dy * dErr;
    if (param === b.x) return +dx * dErr;
    if (param === b.y) return +dy * dErr;

    return 0;
  }

  private _errorPerpendicular(constraint: TConstraintPerpendicular): number {
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

    const err = (dx1 * dx2 + dy1 * dy2) ** 2;

    return err;
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

    const dErr = 2 * (dx1 * dx2 + dy1 * dy2);

    if (param === A.x) return -dx2 * dErr;
    if (param === A.y) return -dy2 * dErr;
    if (param === B.x) return +dx2 * dErr;
    if (param === B.y) return +dy2 * dErr;
    if (param === C.x) return -dx1 * dErr;
    if (param === C.y) return -dy1 * dErr;
    if (param === D.x) return +dx1 * dErr;
    if (param === D.y) return +dy1 * dErr;

    return 0;
  }

  private _errorCoincident(constraint: TConstraintCoincident): number {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const dx = a.x[0] - b.x[0];
    const dy = a.y[0] - b.y[0];

    const err = dx * dx + dy * dy;

    return err;
  }

  private _gradCoincident(constraint: TConstraintCoincident, param: TParam): number {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const ax = a.x[0];
    const ay = a.y[0];
    const bx = b.x[0];
    const by = b.y[0];

    const dx = 2 * (ax - bx);
    const dy = 2 * (ay - by);

    if (param === a.x) return +dx;
    if (param === a.y) return +dy;
    if (param === b.x) return -dx;
    if (param === b.y) return -dy;

    return 0;
  }

  private _errorRadius(constraint: TConstraintRadius): number {
    const c = this._getGeo(constraint.c_id, EGeo.Circle);

    const dr = c.r[0] - constraint.r;

    const err = dr * dr;

    return err;
  }

  private _gradRadius(constraint: TConstraintRadius, param: TParam): number {
    const c = this._getGeo(constraint.c_id, EGeo.Circle);

    const dr = 2 * (c.r[0] - constraint.r);

    if (param === c.r) return +dr;

    return 0;
  }

  private _errorPointOnCircle(constraint: TConstraintPointOnCircle): number {
    const circle = this._getGeo(constraint.c_id, EGeo.Circle);
    const p = this._getGeo(constraint.p_id, EGeo.Point);
    const c = this._getGeo(circle.c_id, EGeo.Point);

    const px = p.x[0];
    const py = p.y[0];
    const cx = c.x[0];
    const cy = c.y[0];
    const r = circle.r[0];

    const dx = px - cx;
    const dy = py - cy;
    const dist_2 = dx * dx + dy * dy;

    const err = (dist_2 - r ** 2) ** 2;

    return err;
  }

  private _gradPointOnCircle(constraint: TConstraintPointOnCircle, param: TParam): number {
    const circle = this._getGeo(constraint.c_id, EGeo.Circle);
    const p = this._getGeo(constraint.p_id, EGeo.Point);
    const c = this._getGeo(circle.c_id, EGeo.Point);

    const px = p.x[0];
    const py = p.y[0];
    const cx = c.x[0];
    const cy = c.y[0];
    const r = circle.r[0];

    const dx = px - cx;
    const dy = py - cy;
    const dist_2 = dx * dx + dy * dy;

    const dErr = 2 * (dist_2 - r ** 2);

    if (param === p.x) return +dx * 2 * dErr;
    if (param === p.y) return +dy * 2 * dErr;
    if (param === c.x) return -dx * 2 * dErr;
    if (param === c.y) return -dy * 2 * dErr;
    if (param === circle.r) return r * 2 * dErr;

    return 0;
  }
}
