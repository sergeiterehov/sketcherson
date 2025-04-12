export type TIdentified<T extends object> = { id: number } & T;

export enum EShape {
  Point = "point",
  Line = "line",
  Segment = "segment",
  Circle = "circle",
}

export enum EConstraint {
  Equals = "equals",
  Distance = "distance",
  Perpendicular = "perpendicular",
  Coincident = "coincident",
  Fix = "fix",
  Radius = "radius",
}

export type TSomeShape<E extends EShape, T extends object> = TIdentified<{ shape: E } & T>;
export type TSomeConstraint<E extends EConstraint, T extends object> = TIdentified<{ constraint: E } & T>;

export type TShapePoint = TSomeShape<
  EShape.Point,
  {
    x: number;
    y: number;
  }
>;

export type TShapeLine = TSomeShape<
  EShape.Line,
  {
    k: number;
    b: number;
  }
>;

export type TShapeSegment = TSomeShape<
  EShape.Segment,
  {
    a_id: number;
    b_id: number;
  }
>;

export type TShapeCircle = TSomeShape<
  EShape.Circle,
  {
    c_id: number;
    r: number;
  }
>;

export type TShape = TShapePoint | TShapeLine | TShapeSegment | TShapeCircle;

export type TConstraintEquals = TSomeConstraint<
  EConstraint.Equals,
  {
    a_id: number;
    b_id: number;
  }
>;

export type TConstraintDistance = TSomeConstraint<
  EConstraint.Distance,
  {
    a_id: number;
    b_id: number;
    d: number;
  }
>;

export type TConstraintPerpendicular = TSomeConstraint<
  EConstraint.Perpendicular,
  {
    a_id: number;
    b_id: number;
  }
>;

export type TConstraintCoincident = TSomeConstraint<
  EConstraint.Coincident,
  {
    a_id: number;
    b_id: number;
  }
>;

export type TConstraintFix = TSomeConstraint<
  EConstraint.Fix,
  {
    p_id: number;
    x: number;
    y: number;
  }
>;

export type TConstraintRadius = TSomeConstraint<
  EConstraint.Radius,
  {
    c_id: number;
    r: number;
  }
>;

export type TConstraint =
  | TConstraintEquals
  | TConstraintDistance
  | TConstraintPerpendicular
  | TConstraintCoincident
  | TConstraintFix
  | TConstraintRadius;

export type TSketch = {
  shapes: TShape[];
  constraints: TConstraint[];
};
