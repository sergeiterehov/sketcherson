import {
  EConstraint,
  EGeo,
  TConstraintCoincident,
  TConstraintDistance,
  TConstraintFix,
  TConstraintHorizontal,
  TConstraintPerpendicular,
  TConstraintPointOnCircle,
  TConstraintPointOnLine,
  TConstraintRadius,
  TConstraintVertical,
  TGeoCircle,
  TGeoPoint,
  TGeoSegment,
  TParam,
  TSketch,
} from "./types";

let id = 1;

export const getPoint = (sketch: TSketch, id: number): TGeoPoint => {
  for (const s of sketch.geos) {
    if (s.id === id && s.geo === EGeo.Point) return s;
  }

  throw new Error("E_POINT_NOT_FOUND");
};

export const makeId = () => id++;

export const makeParam = (value: number): TParam => [value];

export const makeSketch = (): TSketch => ({ geos: [], constraints: [] });

export const makeFix = (sketch: TSketch, p: TGeoPoint): TConstraintFix => {
  const c: TConstraintFix = {
    id: makeId(),
    constraint: EConstraint.Fix,
    p_id: p.id,
    x: p.x[0],
    y: p.y[0],
  };

  sketch.constraints.push(c);

  return c;
};

export const makeDistance = (sketch: TSketch, a: TGeoPoint, b: TGeoPoint, d: number): TConstraintDistance => {
  const c: TConstraintDistance = {
    id: makeId(),
    constraint: EConstraint.Distance,
    a_id: a.id,
    b_id: b.id,
    d,
  };

  sketch.constraints.push(c);

  return c;
};

export const makeCoincident = (sketch: TSketch, a: TGeoPoint, b: TGeoPoint): TConstraintCoincident => {
  const c: TConstraintCoincident = {
    id: makeId(),
    constraint: EConstraint.Coincident,
    a_id: a.id,
    b_id: b.id,
  };

  sketch.constraints.push(c);

  return c;
};

export const makePerpendicular = (sketch: TSketch, a: TGeoSegment, b: TGeoSegment): TConstraintPerpendicular => {
  const c: TConstraintPerpendicular = {
    id: makeId(),
    constraint: EConstraint.Perpendicular,
    a_id: a.id,
    b_id: b.id,
  };

  sketch.constraints.push(c);

  return c;
};

export const makeRadius = (sketch: TSketch, c: TGeoCircle, r: number): TConstraintRadius => {
  const con: TConstraintRadius = {
    id: makeId(),
    constraint: EConstraint.Radius,
    c_id: c.id,
    r,
  };

  sketch.constraints.push(con);

  return con;
};

export const makePointOnCircle = (sketch: TSketch, p: TGeoPoint, c: TGeoCircle): TConstraintPointOnCircle => {
  const con: TConstraintPointOnCircle = {
    id: makeId(),
    constraint: EConstraint.PointOnCircle,
    p_id: p.id,
    c_id: c.id,
  };

  sketch.constraints.push(con);

  return con;
};

export const makePointOnLine = (sketch: TSketch, p: TGeoPoint, l: TGeoSegment): TConstraintPointOnLine => {
  const con: TConstraintPointOnLine = {
    id: makeId(),
    constraint: EConstraint.PointOnLine,
    p_id: p.id,
    l_id: l.id,
  };

  sketch.constraints.push(con);

  return con;
};

export const makeHorizontal = (sketch: TSketch, a: TGeoPoint, b: TGeoPoint): TConstraintHorizontal => {
  const con: TConstraintHorizontal = {
    id: makeId(),
    constraint: EConstraint.Horizontal,
    a_id: a.id,
    b_id: b.id,
  };

  sketch.constraints.push(con);

  return con;
};

export const makeVertical = (sketch: TSketch, a: TGeoPoint, b: TGeoPoint): TConstraintVertical => {
  const con: TConstraintVertical = {
    id: makeId(),
    constraint: EConstraint.Vertical,
    a_id: a.id,
    b_id: b.id,
  };

  sketch.constraints.push(con);

  return con;
};

export const makePoint = (sketch: TSketch, x: number, y: number): TGeoPoint => {
  const p: TGeoPoint = {
    id: makeId(),
    geo: EGeo.Point,
    x: makeParam(x),
    y: makeParam(y),
  };

  sketch.geos.push(p);

  return p;
};

export const makeSegment4 = (
  sketch: TSketch,
  ax: number,
  ay: number,
  bx: number,
  by: number
): [TGeoSegment, TGeoPoint, TGeoPoint] => {
  const a: TGeoPoint = makePoint(sketch, ax, ay);
  const b: TGeoPoint = makePoint(sketch, bx, by);

  const s: TGeoSegment = {
    id: makeId(),
    geo: EGeo.Segment,
    a_id: a.id,
    b_id: b.id,
  };

  sketch.geos.push(s);

  return [s, a, b];
};

export const makeSegment3 = (sketch: TSketch, a: TGeoPoint, bx: number, by: number): [TGeoSegment, TGeoPoint] => {
  const b: TGeoPoint = makePoint(sketch, bx, by);

  const s: TGeoSegment = {
    id: makeId(),
    geo: EGeo.Segment,
    a_id: a.id,
    b_id: b.id,
  };

  sketch.geos.push(s);

  return [s, b];
};

export const makeCircle3 = (sketch: TSketch, cx: number, cy: number, r: number): [TGeoCircle, TGeoPoint] => {
  const c = makePoint(sketch, cx, cy);

  const circle: TGeoCircle = {
    id: makeId(),
    geo: EGeo.Circle,
    c_id: c.id,
    r: makeParam(r),
  };

  sketch.geos.push(circle);

  return [circle, c];
};

export const makeRect4 = (
  sketch: TSketch,
  ax: number,
  ay: number,
  bx: number,
  by: number
): [
  [TGeoSegment, TGeoPoint, TGeoPoint],
  [TGeoSegment, TGeoPoint, TGeoPoint],
  [TGeoSegment, TGeoPoint, TGeoPoint],
  [TGeoSegment, TGeoPoint, TGeoPoint]
] => {
  const lh_a = makeSegment4(sketch, ax, ay, bx, ay);
  const lv_a = makeSegment4(sketch, bx, ay, bx, by);
  const lh_b = makeSegment4(sketch, bx, by, ax, by);
  const lv_b = makeSegment4(sketch, ax, by, ax, ay);

  makeCoincident(sketch, lh_a[1], lv_b[2]);
  makeCoincident(sketch, lh_a[2], lv_a[1]);
  makeCoincident(sketch, lv_a[2], lh_b[1]);
  makeCoincident(sketch, lh_b[2], lv_b[1]);

  makeVertical(sketch, lv_a[1], lv_a[2]);
  makeVertical(sketch, lv_b[1], lv_b[2]);
  makeHorizontal(sketch, lh_a[1], lh_a[2]);
  makeHorizontal(sketch, lh_b[1], lh_b[2]);

  return [lh_a, lv_a, lh_b, lv_b];
};
