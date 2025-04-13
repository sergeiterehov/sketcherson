export type TParam = [number];
export type TID = number;

export type TIdentified<T extends object> = { id: TID } & T;

export enum EGeo {
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

export type TSomeGeo<E extends EGeo, T extends object> = TIdentified<{ geo: E } & T>;
export type TSomeConstraint<E extends EConstraint, T extends object> = TIdentified<{ constraint: E } & T>;

export type TGeoPoint = TSomeGeo<
  EGeo.Point,
  {
    x: TParam;
    y: TParam;
  }
>;

export type TGeoLine = TSomeGeo<
  EGeo.Line,
  {
    k: TParam;
    b: TParam;
  }
>;

export type TGeoSegment = TSomeGeo<
  EGeo.Segment,
  {
    a_id: TID;
    b_id: TID;
  }
>;

export type TGeoCircle = TSomeGeo<
  EGeo.Circle,
  {
    c_id: TID;
    r: TParam;
  }
>;

export type TGeo = TGeoPoint | TGeoLine | TGeoSegment | TGeoCircle;

export type TConstraintEquals = TSomeConstraint<
  EConstraint.Equals,
  {
    a_id: TID;
    b_id: TID;
  }
>;

export type TConstraintDistance = TSomeConstraint<
  EConstraint.Distance,
  {
    a_id: TID;
    b_id: TID;
    d: number;
  }
>;

export type TConstraintPerpendicular = TSomeConstraint<
  EConstraint.Perpendicular,
  {
    a_id: TID;
    b_id: TID;
  }
>;

export type TConstraintCoincident = TSomeConstraint<
  EConstraint.Coincident,
  {
    a_id: TID;
    b_id: TID;
  }
>;

export type TConstraintFix = TSomeConstraint<
  EConstraint.Fix,
  {
    p_id: TID;
    x: number;
    y: number;
  }
>;

export type TConstraintRadius = TSomeConstraint<
  EConstraint.Radius,
  {
    c_id: TID;
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
  geos: TGeo[];
  constraints: TConstraint[];
};
