import {
  EConstraint,
  EGeo,
  TConstraintCoincident,
  TConstraintDistance,
  TConstraintFix,
  TConstraintPerpendicular,
  TConstraintPointOnCircle,
  TConstraintRadius,
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

  throw "E_POINT_NOT_FOUND";
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
): [TGeoSegment, TGeoSegment, TGeoSegment, TGeoSegment] => {
  const la = makeSegment4(sketch, ax, ay, bx, ay);
  const lb = makeSegment4(sketch, bx, ay, bx, by);
  const lc = makeSegment4(sketch, bx, by, ax, by);
  const ld = makeSegment4(sketch, ax, by, ax, ay);

  makeDistance(sketch, la[1], la[2], Math.abs(bx - ax));
  makeDistance(sketch, lb[1], lb[2], Math.abs(by - ay));
  makeDistance(sketch, lc[1], lc[2], Math.abs(bx - ax));
  makeDistance(sketch, ld[1], ld[2], Math.abs(by - ay));

  makePerpendicular(sketch, la[0], lb[0]);
  makePerpendicular(sketch, lb[0], lc[0]);

  makeCoincident(sketch, la[1], ld[2]);
  makeCoincident(sketch, la[2], lb[1]);
  makeCoincident(sketch, lb[2], lc[1]);
  makeCoincident(sketch, lc[2], ld[1]);

  return [la[0], lb[0], lc[0], ld[0]];
};
