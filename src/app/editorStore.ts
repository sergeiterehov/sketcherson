import { create } from "zustand";
import { SketchSolver } from "./solver";
import { EConstraint, EGeo, TConstraint, TGeo, TID, TSketch } from "./types";
import { makeCoincident, makePointOnCircle, makePointOnLine } from "./utils";

type TEditorStore = {
  scale: number;

  selectedGeoIds: TID[];

  sketch?: TSketch;

  _geoMap: Map<number, TGeo>;

  _solver?: SketchSolver;
  _solvingController: AbortController;
  solvingStats: {
    error: number;
    lambda: number;
    i: number;
  };

  allowCoincident: boolean;
  allowPointOnLine: boolean;
  allowPointOnCircle: boolean;

  paramsOfSelectedGeo: {
    radius?: number;
    length?: number;
    angle?: number;
    distance?: number;
  };

  init(sketch: TSketch): void;
  reset(): void;

  setScale(scale: number): void;

  resetGeoSelection(): void;
  toggleGeoSelection(id: TID): void;
  getSelectedGeos(): TGeo[];

  getGeo(id: TID): TGeo;
  getGeoOf<G extends EGeo>(type: G, id: TID): TGeo & { geo: G };
  getGeoConstraints(id: TID): TConstraint[];

  _updateCoincidentAllows(): void;
  createCoincident(): void;
  createPointOnLine(): void;
  createPointOnCircle(): void;

  _explainSelectedParams(): void;

  _abort(): void;
  _solve(): void;
  _updateGeoMap(): void;
};

const useEditorStore = create<TEditorStore>((set, get) => ({
  scale: 1,

  selectedGeoIds: [],

  _geoMap: new Map(),

  solvingStats: { error: 0, i: 0, lambda: 0 },
  _solvingController: new AbortController(),

  allowCoincident: false,
  allowPointOnLine: false,
  allowPointOnCircle: false,

  paramsOfSelectedGeo: {},

  init: (sketch) => {
    const { _abort, resetGeoSelection, _solve, _updateGeoMap } = get();

    _abort();
    set({ sketch: sketch, _solver: new SketchSolver(sketch) });
    _updateGeoMap();
    resetGeoSelection();
    _solve();
  },

  reset: () => {
    get()._abort();
    set({ sketch: undefined, _solver: undefined, _geoMap: new Map() });
  },

  setScale: (scale: number) => {
    set({ scale });
  },

  resetGeoSelection: () => {
    set({ selectedGeoIds: [] });
    get()._updateCoincidentAllows();
    get()._explainSelectedParams();
  },

  toggleGeoSelection: (id) => {
    set(({ selectedGeoIds: prev }) => {
      if (prev.includes(id)) {
        return { selectedGeoIds: prev.filter((iid) => iid !== id) };
      }

      return { selectedGeoIds: [...prev, id] };
    });
    get()._updateCoincidentAllows();
    get()._explainSelectedParams();
  },

  getSelectedGeos: () => {
    const { getGeo, selectedGeoIds } = get();

    return selectedGeoIds.map((id) => getGeo(id));
  },

  _updateGeoMap: () => {
    const sketch = get().sketch;

    if (!sketch) return;

    const map = get()._geoMap;

    map.clear();

    for (const geos of sketch.geos) {
      map.set(geos.id, geos);
    }
  },

  getGeo: (id) => {
    const geo = get()._geoMap.get(id);

    if (!geo) throw new Error(`Geo ID:${id} not found in map`);

    return geo;
  },

  getGeoOf: (type, id) => {
    const geo = get().getGeo(id);

    if (geo.geo !== type) throw new Error(`Geo ID:${id} has type ${geo.geo}, but ${type} required`);

    return geo as TGeo & { geo: typeof type };
  },

  getGeoConstraints: (id) => {
    // TODO: переделать на map, обновляемый в _updateGeoMap
    const result: TConstraint[] = [];

    const { sketch } = get();

    if (!sketch) return result;

    for (const c of sketch.constraints) {
      let ok = false;

      if (c.constraint === EConstraint.Perpendicular) {
        ok = c.a_id === id || c.b_id === id;
      } else if (c.constraint === EConstraint.Coincident) {
        ok = c.a_id === id || c.b_id === id;
      } else if (c.constraint === EConstraint.PointOnCircle) {
        ok = c.c_id === id || c.p_id === id;
      } else if (c.constraint === EConstraint.PointOnLine) {
        ok = c.l_id === id || c.p_id === id;
      } else if (c.constraint === EConstraint.Radius) {
        ok = c.c_id === id;
      }

      if (ok) result.push(c);
    }

    return result;
  },

  _updateCoincidentAllows: () => {
    const selectedGeos = get().getSelectedGeos();

    set({
      allowCoincident: (() => {
        if (selectedGeos.length < 2) return false;

        return selectedGeos.every((g) => g.geo === EGeo.Point);
      })(),
      allowPointOnLine: (() => {
        if (selectedGeos.length < 2) return false;

        let lines = 0;
        let points = 0;

        for (const geo of selectedGeos) {
          if (geo.geo === EGeo.Segment) {
            lines += 1;
          } else if (geo.geo === EGeo.Point) {
            points += 1;
          }

          if (lines > 1) return false;
        }

        if (!lines || !points) return false;

        return true;
      })(),
      allowPointOnCircle: (() => {
        if (selectedGeos.length < 2) return false;

        let circles = 0;
        let points = 0;

        for (const geo of selectedGeos) {
          if (geo.geo === EGeo.Circle) {
            circles += 1;
          } else if (geo.geo === EGeo.Point) {
            points += 1;
          }

          if (circles > 1) return false;
        }

        if (!circles || !points) return false;

        return true;
      })(),
    });
  },

  createCoincident: () => {
    const { sketch, getSelectedGeos, resetGeoSelection, _solve } = get();

    if (!sketch) return;

    const selectedGeos = getSelectedGeos();

    if (selectedGeos.length < 2) return;

    const [target, ...sources] = selectedGeos;

    if (target.geo !== EGeo.Point) return;

    for (const source of sources) {
      if (source.geo !== EGeo.Point) continue;

      makeCoincident(sketch, target, source);
    }

    resetGeoSelection();
    _solve();
  },

  createPointOnLine: () => {
    const { sketch, getSelectedGeos, resetGeoSelection, _solve } = get();

    if (!sketch) return;

    const selectedGeos = getSelectedGeos();

    if (selectedGeos.length < 2) return;

    const line = selectedGeos.find((g) => g.geo === EGeo.Segment);

    if (!line) return;

    for (const geo of selectedGeos) {
      if (geo.geo !== EGeo.Point) continue;

      makePointOnLine(sketch, geo, line);
    }

    resetGeoSelection();
    _solve();
  },

  createPointOnCircle: () => {
    const { sketch, getSelectedGeos, resetGeoSelection, _solve } = get();

    if (!sketch) return;

    const selectedGeos = getSelectedGeos();

    if (selectedGeos.length < 2) return;

    const circle = selectedGeos.find((g) => g.geo === EGeo.Circle);

    if (!circle) return;

    for (const geo of selectedGeos) {
      if (geo.geo !== EGeo.Point) continue;

      makePointOnCircle(sketch, geo, circle);
    }

    resetGeoSelection();
    _solve();
  },

  _explainSelectedParams: () => {
    const params: TEditorStore["paramsOfSelectedGeo"] = {};

    const { getSelectedGeos, getGeoOf } = get();
    const geos = getSelectedGeos();

    if (geos.length === 1) {
      const [geo] = geos;

      if (geo.geo === EGeo.Segment) {
        const a = getGeoOf(EGeo.Point, geo.a_id);
        const b = getGeoOf(EGeo.Point, geo.b_id);

        params.length = Math.sqrt((a.x[0] - b.x[0]) ** 2 + (a.y[0] - b.y[0]) ** 2);
      } else if (geo.geo === EGeo.Circle) {
        params.radius = geo.r[0];
      }
    } else if (geos.length === 2) {
      const [geo_1, geo_2] = geos;

      if (geo_1.geo === EGeo.Point && geo_2.geo === EGeo.Point) {
        params.distance = Math.sqrt((geo_1.x[0] - geo_2.x[0]) ** 2 + (geo_1.y[0] - geo_2.y[0]) ** 2);
      }
    }

    set({ paramsOfSelectedGeo: params });
  },

  _abort: () => {
    const currentController = get()._solvingController;

    if (currentController) {
      currentController.abort();
    }

    const controller = new AbortController();

    set({ _solvingController: controller });
  },

  _solve: () => {
    get()._abort();

    const solver = get()._solver;

    if (!solver) return;

    const frameTime = 16;

    const solving = solver.solve({ rollbackOnError: false, iterationsLimit: 10_000_000, logDivider: 20_000 });

    let prevStepAt = 0;
    let animRequest = 0;

    const loop = () => {
      animRequest = requestAnimationFrame(loop);

      const now = Date.now();

      if (now - prevStepAt < frameTime) return;

      prevStepAt = now;

      try {
        const { done, value } = solving.next();

        if (done) {
          set({ solvingStats: { error: 0, i: 0, lambda: 0 } });
          return;
        }

        set({ solvingStats: value });
      } catch (e) {
        set({ solvingStats: { error: -1, i: 0, lambda: 0 } });
        console.error("Solving error:", e);
      }
    };

    loop();

    get()._solvingController.signal.addEventListener("abort", () => {
      cancelAnimationFrame(animRequest);
      solving.return();
    });
  },
}));

export default useEditorStore;
