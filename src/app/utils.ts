import {
  EConstraint,
  EShape,
  TConstraintCoincident,
  TConstraintDistance,
  TConstraintFix,
  TConstraintPerpendicular,
  TShapePoint,
  TShapeSegment,
  TSketch,
} from "./types";

let id = 1;

export const getPoint = (sketch: TSketch, id: number): TShapePoint => {
  for (const s of sketch.shapes) {
    if (s.id === id && s.shape === EShape.Point) return s;
  }

  throw "E_POINT_NOT_FOUND";
};

export const makeId = () => id++;

export const makeSketch = (): TSketch => ({ shapes: [], constraints: [] });

export const makeFix = (sketch: TSketch, p: TShapePoint): TConstraintFix => {
  const c: TConstraintFix = {
    id: makeId(),
    constraint: EConstraint.Fix,
    p_id: p.id,
    x: p.x,
    y: p.y,
  };

  sketch.constraints.push(c);

  return c;
};

export const makeDistance = (sketch: TSketch, a: TShapePoint, b: TShapePoint, d: number): TConstraintDistance => {
  const c: TConstraintDistance = {
    id: makeId(),
    constraint: EConstraint.Distance,
    a_id: a.id,
    b_id: b.id,
    distance: d,
  };

  sketch.constraints.push(c);

  return c;
};

export const makeCoincident = (sketch: TSketch, a: TShapePoint, b: TShapePoint): TConstraintCoincident => {
  const c: TConstraintCoincident = {
    id: makeId(),
    constraint: EConstraint.Coincident,
    a_id: a.id,
    b_id: b.id,
  };

  sketch.constraints.push(c);

  return c;
};

export const makePerpendicular = (sketch: TSketch, a: TShapeSegment, b: TShapeSegment): TConstraintPerpendicular => {
  const c: TConstraintPerpendicular = {
    id: makeId(),
    constraint: EConstraint.Perpendicular,
    a_id: a.id,
    b_id: b.id,
  };

  sketch.constraints.push(c);

  return c;
};

export const makePoint = (sketch: TSketch, x: number, y: number): TShapePoint => {
  const p: TShapePoint = {
    id: makeId(),
    shape: EShape.Point,
    x,
    y,
  };

  sketch.shapes.push(p);

  return p;
};

export const makeSegment4 = (
  sketch: TSketch,
  ax: number,
  ay: number,
  bx: number,
  by: number
): [TShapeSegment, TShapePoint, TShapePoint] => {
  const a: TShapePoint = makePoint(sketch, ax, ay);
  const b: TShapePoint = makePoint(sketch, bx, by);

  const s: TShapeSegment = {
    id: makeId(),
    shape: EShape.Segment,
    a_id: a.id,
    b_id: b.id,
  };

  sketch.shapes.push(s);

  return [s, a, b];
};

export const makeSegment3 = (sketch: TSketch, a: TShapePoint, bx: number, by: number): [TShapeSegment, TShapePoint] => {
  const b: TShapePoint = makePoint(sketch, bx, by);

  const s: TShapeSegment = {
    id: makeId(),
    shape: EShape.Segment,
    a_id: a.id,
    b_id: b.id,
  };

  sketch.shapes.push(s);

  return [s, b];
};

export const makeRect4 = (
  sketch: TSketch,
  ax: number,
  ay: number,
  bx: number,
  by: number
): [TShapeSegment, TShapeSegment, TShapeSegment, TShapeSegment] => {
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
