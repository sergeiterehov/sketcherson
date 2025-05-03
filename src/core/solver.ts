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
  TConstraintPointOnLine,
  TConstraintVertical,
  TConstraintHorizontal,
  TConstraintParallel,
  TConstraintAngle,
} from "./types";

const ERROR_TOLERANCE = 1e-5;

export class SketchSolver {
  private geoMap = new Map<number, TGeo>();

  private _getGeo<E extends EGeo>(id: number, type: E): TGeo & { geo: E } {
    const geo = this.geoMap.get(id);

    if (!geo) throw new Error("E_REF");

    if (geo.geo !== type) throw new Error("E_GEO_TYPE");

    return geo as TGeo & { geo: E };
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
    /** Ограничение количества итераций */
    iterationsLimit?: number;
    /** yeld-лог каждый n итераций */
    logDivider?: number;
    /** Ограничение по времени в мс */
    timeLimit?: number;
    /** Возврат к исходному состоянию при ошибке */
    rollbackOnError?: boolean;
  }): Generator<{ error: number; lambda: number; i: number }, void> {
    const { iterationsLimit = 1_000_000, logDivider, timeLimit, rollbackOnError = true } = config;
    const statedAt = Date.now();

    const { constraints } = this.sketch;

    const params: TParam[] = [];

    for (const constraint of constraints) {
      const constraintParams = this._grubConstraintGeoParams(constraint);

      for (const param of constraintParams) {
        if (params.includes(param)) continue;

        params.push(param);
      }
    }

    // Градиентный спуск ошибки с адаптивным шагом

    const factor = 2;

    let lambda = 0.001;
    let error = 0;

    for (const constraint of constraints) {
      error += this._error(constraint);
    }

    /** Градиенты для параметров */
    const grads = new Map<TParam, TParam>();

    for (const param of params) {
      grads.set(param, [0]);
    }

    /** Значения параметров для отмены шага */
    const backup: number[] = new Array(params.length);

    /** Значения параметров для возврата в исходную позицию */
    const initialParams: number[] = new Array(params.length);

    for (let pi = params.length - 1; pi >= 0; pi -= 1) {
      initialParams[pi] = params[pi][0];
    }

    for (let i = 0; i <= iterationsLimit; i += 1) {
      // Логирование для отладки
      if (logDivider && i % logDivider === 0) yield { error, lambda, i };

      // Останавливаемся, если ошибка достигла минимума
      if (error < ERROR_TOLERANCE) return;

      // Прерывание по таймауту
      if (timeLimit && i % 100 === 0 && Date.now() - statedAt > timeLimit) break;

      // Крайние значения, из которых не выбраться
      if (lambda === Infinity || lambda === 0) break;

      // Сохраняем значения параметров для отката
      for (let pi = params.length - 1; pi >= 0; pi -= 1) {
        backup[pi] = params[pi][0];
      }

      // Обновляем параметры градиентным спуском ошибки
      for (const grad of grads.values()) {
        grad[0] = 0;
      }

      for (const constraint of constraints) {
        this._grad(constraint, grads);
      }

      for (const [param, [grad]] of grads.entries()) {
        param[0] -= grad / (lambda + Math.abs(grad));
      }

      // Корректируем настройки, если ошибка растет
      let stepError = 0;

      for (const constraint of constraints) {
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
    // Если вышли из цикла, а не из функции, значит решение не найдено

    // Возвращаем значения обратно к исходным
    if (rollbackOnError) {
      for (let pi = params.length - 1; pi >= 0; pi -= 1) {
        params[pi][0] = initialParams[pi];
      }
    }

    throw new Error("SOLUTION_NOT_FOUND");
  }

  private _grubConstraintGeoParams(constraint: TConstraint): TParam[] {
    switch (constraint.constraint) {
      case EConstraint.Fix: {
        const p = this._getGeo(constraint.p_id, EGeo.Point);

        return [p.x, p.y];
      }
      case EConstraint.Distance: {
        const a = this._getGeo(constraint.a_id, EGeo.Point);
        const b = this._getGeo(constraint.b_id, EGeo.Point);

        return [a.x, a.y, b.x, b.y];
      }
      case EConstraint.Parallel:
      case EConstraint.Angle:
      case EConstraint.Perpendicular: {
        const A = this._getGeo(constraint.a_id, EGeo.Segment);
        const B = this._getGeo(constraint.b_id, EGeo.Segment);
        const a1 = this._getGeo(A.a_id, EGeo.Point);
        const a2 = this._getGeo(A.b_id, EGeo.Point);
        const b1 = this._getGeo(B.a_id, EGeo.Point);
        const b2 = this._getGeo(B.b_id, EGeo.Point);

        return [a1.x, a1.y, a2.x, a2.y, b1.x, b1.y, b2.x, b2.y];
      }
      case EConstraint.Coincident: {
        const a = this._getGeo(constraint.a_id, EGeo.Point);
        const b = this._getGeo(constraint.b_id, EGeo.Point);

        return [a.x, a.y, b.x, b.y];
      }
      case EConstraint.Radius: {
        const c = this._getGeo(constraint.c_id, EGeo.Circle);

        return [c.r];
      }
      case EConstraint.PointOnCircle: {
        const circle = this._getGeo(constraint.c_id, EGeo.Circle);
        const c = this._getGeo(circle.c_id, EGeo.Point);
        const p = this._getGeo(constraint.p_id, EGeo.Point);

        return [circle.r, c.x, c.y, p.x, p.y];
      }
      case EConstraint.PointOnLine: {
        const p = this._getGeo(constraint.p_id, EGeo.Point);
        const line = this._getGeo(constraint.l_id, EGeo.Segment);
        const a = this._getGeo(line.a_id, EGeo.Point);
        const b = this._getGeo(line.b_id, EGeo.Point);

        return [p.x, p.y, a.x, a.y, b.x, b.y];
      }
      case EConstraint.Horizontal:
      case EConstraint.Vertical: {
        const a = this._getGeo(constraint.a_id, EGeo.Point);
        const b = this._getGeo(constraint.b_id, EGeo.Point);

        return [a.x, a.y, b.x, b.y];
      }
      default:
        throw new Error("E_UNSUPPORTED_CONSTRAINT");
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
      case EConstraint.Parallel:
        return this._errorParallel(constraint);
      case EConstraint.Coincident:
        return this._errorCoincident(constraint);
      case EConstraint.Radius:
        return this._errorRadius(constraint);
      case EConstraint.PointOnCircle:
        return this._errorPointOnCircle(constraint);
      case EConstraint.PointOnLine:
        return this._errorPointOnLine(constraint);
      case EConstraint.Vertical:
        return this._errorVertical(constraint);
      case EConstraint.Horizontal:
        return this._errorHorizontal(constraint);
      case EConstraint.Angle:
        return this._errorAngle(constraint);
      default:
        return 0;
    }
  }

  private _grad(constraint: TConstraint, params: Map<TParam, TParam>): void {
    switch (constraint.constraint) {
      case EConstraint.Fix:
        return this._gradFix(constraint, params);
      case EConstraint.Distance:
        return this._gradDistance(constraint, params);
      case EConstraint.Perpendicular:
        return this._gradPerpendicular(constraint, params);
      case EConstraint.Parallel:
        return this._gradParallel(constraint, params);
      case EConstraint.Coincident:
        return this._gradCoincident(constraint, params);
      case EConstraint.Radius:
        return this._gradRadius(constraint, params);
      case EConstraint.PointOnCircle:
        return this._gradPointOnCircle(constraint, params);
      case EConstraint.PointOnLine:
        return this._gradPointOnLine(constraint, params);
      case EConstraint.Vertical:
        return this._gradVertical(constraint, params);
      case EConstraint.Horizontal:
        return this._gradHorizontal(constraint, params);
      case EConstraint.Angle:
        return this._gradAngle(constraint, params);
      default:
        return;
    }
  }

  private _errorFix(constraint: TConstraintFix): number {
    const p = this._getGeo(constraint.p_id, EGeo.Point);

    const dx = p.x[0] - constraint.x;
    const dy = p.y[0] - constraint.y;

    const err = dx * dx + dy * dy;

    return err;
  }

  private _gradFix(constraint: TConstraintFix, params: Map<TParam, TParam>) {
    const p = this._getGeo(constraint.p_id, EGeo.Point);

    const ax = p.x[0];
    const ay = p.y[0];

    const dx = 2 * (ax - constraint.x);
    const dy = 2 * (ay - constraint.y);

    params.get(p.x)![0] += +dx;
    params.get(p.y)![0] += +dy;
  }

  private _errorCoincident(constraint: TConstraintCoincident): number {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const dx = a.x[0] - b.x[0];
    const dy = a.y[0] - b.y[0];

    const err = dx * dx + dy * dy;

    return err;
  }

  private _gradCoincident(constraint: TConstraintCoincident, params: Map<TParam, TParam>) {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const ax = a.x[0];
    const ay = a.y[0];
    const bx = b.x[0];
    const by = b.y[0];

    const dx = 2 * (ax - bx);
    const dy = 2 * (ay - by);

    params.get(a.x)![0] += +dx;
    params.get(a.y)![0] += +dy;
    params.get(b.x)![0] += -dx;
    params.get(b.y)![0] += -dy;
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

  private _gradDistance(constraint: TConstraintDistance, params: Map<TParam, TParam>) {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const dx = b.x[0] - a.x[0];
    const dy = b.y[0] - a.y[0];

    const d = Math.sqrt(dx * dx + dy * dy);

    const dErr = (2 * (d - constraint.d)) / Math.max(ERROR_TOLERANCE, d);

    params.get(a.x)![0] += -dx * dErr;
    params.get(a.y)![0] += -dy * dErr;
    params.get(b.x)![0] += +dx * dErr;
    params.get(b.y)![0] += +dy * dErr;
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

  private _gradPerpendicular(constraint: TConstraintPerpendicular, params: Map<TParam, TParam>) {
    const AB = this._getGeo(constraint.a_id, EGeo.Segment);
    const CD = this._getGeo(constraint.b_id, EGeo.Segment);

    const a = this._getGeo(AB.a_id, EGeo.Point);
    const b = this._getGeo(AB.b_id, EGeo.Point);
    const c = this._getGeo(CD.a_id, EGeo.Point);
    const d = this._getGeo(CD.b_id, EGeo.Point);

    const dx1 = b.x[0] - a.x[0];
    const dy1 = b.y[0] - a.y[0];
    const dx2 = d.x[0] - c.x[0];
    const dy2 = d.y[0] - c.y[0];

    const dErr = 2 * (dx1 * dx2 + dy1 * dy2);

    params.get(a.x)![0] += -dx2 * dErr;
    params.get(a.y)![0] += -dy2 * dErr;
    params.get(b.x)![0] += +dx2 * dErr;
    params.get(b.y)![0] += +dy2 * dErr;
    params.get(c.x)![0] += -dx1 * dErr;
    params.get(c.y)![0] += -dy1 * dErr;
    params.get(d.x)![0] += +dx1 * dErr;
    params.get(d.y)![0] += +dy1 * dErr;
  }

  private _errorParallel(constraint: TConstraintParallel): number {
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

    const err = (dx1 * dy2 - dy1 * dx2) ** 2;

    return err;
  }

  private _gradParallel(constraint: TConstraintParallel, params: Map<TParam, TParam>) {
    const AB = this._getGeo(constraint.a_id, EGeo.Segment);
    const CD = this._getGeo(constraint.b_id, EGeo.Segment);

    const a = this._getGeo(AB.a_id, EGeo.Point);
    const b = this._getGeo(AB.b_id, EGeo.Point);
    const c = this._getGeo(CD.a_id, EGeo.Point);
    const d = this._getGeo(CD.b_id, EGeo.Point);

    const dx1 = b.x[0] - a.x[0];
    const dy1 = b.y[0] - a.y[0];
    const dx2 = d.x[0] - c.x[0];
    const dy2 = d.y[0] - c.y[0];

    const dErr = 2 * (dx1 * dy2 - dy1 * dx2);

    params.get(a.x)![0] += -dy2 * dErr;
    params.get(a.y)![0] += +dx2 * dErr;
    params.get(b.x)![0] += +dy2 * dErr;
    params.get(b.y)![0] += -dx2 * dErr;
    params.get(c.x)![0] += +dy1 * dErr;
    params.get(c.y)![0] += -dx1 * dErr;
    params.get(d.x)![0] += -dy1 * dErr;
    params.get(d.y)![0] += +dx1 * dErr;
  }

  private _errorRadius(constraint: TConstraintRadius): number {
    const c = this._getGeo(constraint.c_id, EGeo.Circle);

    const dr = c.r[0] - constraint.r;

    const err = dr * dr;

    return err;
  }

  private _gradRadius(constraint: TConstraintRadius, params: Map<TParam, TParam>) {
    const c = this._getGeo(constraint.c_id, EGeo.Circle);

    const dr = 2 * (c.r[0] - constraint.r);

    params.get(c.r)![0] += +dr;
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

  private _gradPointOnCircle(constraint: TConstraintPointOnCircle, params: Map<TParam, TParam>) {
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

    params.get(p.x)![0] += +dx * 2 * dErr;
    params.get(p.y)![0] += +dy * 2 * dErr;
    params.get(c.x)![0] += -dx * 2 * dErr;
    params.get(c.y)![0] += -dy * 2 * dErr;
    params.get(circle.r)![0] += r * 2 * dErr;
  }

  private _errorPointOnLine(constraint: TConstraintPointOnLine): number {
    const p = this._getGeo(constraint.p_id, EGeo.Point);
    const line = this._getGeo(constraint.l_id, EGeo.Segment);
    const a = this._getGeo(line.a_id, EGeo.Point);
    const b = this._getGeo(line.b_id, EGeo.Point);

    const px = p.x[0];
    const py = p.y[0];
    const ax = a.x[0];
    const ay = a.y[0];
    const bx = b.x[0];
    const by = b.y[0];

    return ((by - ay) * (px - ax) - (bx - ax) * (py - ay)) ** 2;
  }

  private _gradPointOnLine(constraint: TConstraintPointOnLine, params: Map<TParam, TParam>) {
    const p = this._getGeo(constraint.p_id, EGeo.Point);
    const line = this._getGeo(constraint.l_id, EGeo.Segment);
    const a = this._getGeo(line.a_id, EGeo.Point);
    const b = this._getGeo(line.b_id, EGeo.Point);

    const ax = a.x[0];
    const ay = a.y[0];

    const dx = b.x[0] - ax;
    const dy = b.y[0] - ay;
    const px = p.x[0] - ax;
    const py = p.y[0] - ay;

    const dErr = 2 * (dy * px - dx * py);

    params.get(p.x)![0] += +dy * dErr;
    params.get(p.y)![0] += -dx * dErr;
    params.get(a.x)![0] += -(dy - py) * dErr;
    params.get(a.y)![0] += -(px - dx) * dErr;
    params.get(b.x)![0] += -py * dErr;
    params.get(b.y)![0] += +px * dErr;
  }

  private _errorVertical(constraint: TConstraintVertical): number {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const dx = a.x[0] - b.x[0];

    const err = dx * dx;

    return err;
  }

  private _gradVertical(constraint: TConstraintVertical, params: Map<TParam, TParam>) {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const ax = a.x[0];
    const bx = b.x[0];

    const dx = 2 * (ax - bx);

    params.get(a.x)![0] += +dx;
    params.get(b.x)![0] += -dx;
  }

  private _errorHorizontal(constraint: TConstraintHorizontal): number {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const dy = a.y[0] - b.y[0];

    const err = dy * dy;

    return err;
  }

  private _gradHorizontal(constraint: TConstraintHorizontal, params: Map<TParam, TParam>) {
    const a = this._getGeo(constraint.a_id, EGeo.Point);
    const b = this._getGeo(constraint.b_id, EGeo.Point);

    const ay = a.y[0];
    const by = b.y[0];

    const dy = 2 * (ay - by);

    params.get(a.y)![0] += +dy;
    params.get(b.y)![0] += -dy;
  }

  private _errorAngle(constraint: TConstraintAngle): number {
    const AB = this._getGeo(constraint.a_id, EGeo.Segment);
    const CD = this._getGeo(constraint.b_id, EGeo.Segment);

    const a = this._getGeo(AB.a_id, EGeo.Point);
    const b = this._getGeo(AB.b_id, EGeo.Point);
    const c = this._getGeo(CD.a_id, EGeo.Point);
    const d = this._getGeo(CD.b_id, EGeo.Point);

    const dx1 = b.x[0] - a.x[0];
    const dy1 = b.y[0] - a.y[0];
    const dx2 = d.x[0] - c.x[0];
    const dy2 = d.y[0] - c.y[0];

    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    const cosTheta = (dx1 * dx2 + dy1 * dy2) / (len1 * len2);

    // TODO: ошибка в пределах ±1, что очень мало на фоне остальных.
    // Из за маленькой ошибки большая погрешность!

    const err = (cosTheta - Math.cos(constraint.a * (Math.PI / 180))) ** 2;

    return err;
  }

  private _gradAngle(constraint: TConstraintAngle, params: Map<TParam, TParam>) {
    const AB = this._getGeo(constraint.a_id, EGeo.Segment);
    const CD = this._getGeo(constraint.b_id, EGeo.Segment);

    const a = this._getGeo(AB.a_id, EGeo.Point);
    const b = this._getGeo(AB.b_id, EGeo.Point);
    const c = this._getGeo(CD.a_id, EGeo.Point);
    const d = this._getGeo(CD.b_id, EGeo.Point);

    const dx1 = b.x[0] - a.x[0];
    const dy1 = b.y[0] - a.y[0];
    const dx2 = d.x[0] - c.x[0];
    const dy2 = d.y[0] - c.y[0];

    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    const D_val = len1 * len2;
    const cosTheta = (dx1 * dx2 + dy1 * dy2) / D_val;
    const S = cosTheta - Math.cos(constraint.a * (Math.PI / 180));

    const commonFactor = (2 * S) / (D_val * D_val);

    const len1_2 = len1 * len1;
    const len2_2 = len2 * len2;

    params.get(a.x)![0] += +commonFactor * (dy1 * dy2 * dx1 - dx2 * len1_2);
    params.get(a.y)![0] += +commonFactor * (dx1 * dx2 * dy1 - dy2 * len1_2);
    params.get(b.x)![0] += -commonFactor * (dy1 * dy2 * dx1 - dx2 * len1_2);
    params.get(b.y)![0] += -commonFactor * (dx1 * dx2 * dy1 - dy2 * len1_2);
    params.get(c.x)![0] += +commonFactor * (dy1 * dy2 * dx2 - dx1 * len2_2);
    params.get(c.y)![0] += +commonFactor * (dx1 * dx2 * dy2 - dy1 * len2_2);
    params.get(d.x)![0] += -commonFactor * (dy1 * dy2 * dx2 - dx1 * len2_2);
    params.get(d.y)![0] += -commonFactor * (dx1 * dx2 * dy2 - dy1 * len2_2);
  }
}
