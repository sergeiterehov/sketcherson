export type TParam = [number];
export type TID = number;

export type TIdentified<T extends object> = { id: TID } & T;

export enum EGeo {
  Point = "point",
  Segment = "segment",
  Circle = "circle",
}

export enum EConstraint {
  Distance = "distance",
  Perpendicular = "perpendicular",
  Coincident = "coincident",
  Fix = "fix",
  Radius = "radius",
  PointOnCircle = "point_on_circle",
  PointOnLine = "point_on_line",
  Vertical = "vertical",
  Horizontal = "horizontal",
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

export type TGeo = TGeoPoint | TGeoSegment | TGeoCircle;

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

export type TConstraintPointOnCircle = TSomeConstraint<
  EConstraint.PointOnCircle,
  {
    p_id: TID;
    c_id: TID;
  }
>;

export type TConstraintPointOnLine = TSomeConstraint<
  EConstraint.PointOnLine,
  {
    p_id: TID;
    l_id: TID;
  }
>;

export type TConstraintVertical = TSomeConstraint<
  EConstraint.Vertical,
  {
    a_id: TID;
    b_id: TID;
  }
>;

export type TConstraintHorizontal = TSomeConstraint<
  EConstraint.Horizontal,
  {
    a_id: TID;
    b_id: TID;
  }
>;

export type TConstraint =
  | TConstraintDistance
  | TConstraintPerpendicular
  | TConstraintCoincident
  | TConstraintFix
  | TConstraintRadius
  | TConstraintPointOnCircle
  | TConstraintPointOnLine
  | TConstraintVertical
  | TConstraintHorizontal;

export type TSketch = {
  geos: TGeo[];
  constraints: TConstraint[];
};
