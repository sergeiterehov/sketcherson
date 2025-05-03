import { create } from "zustand";
import { SketchSolver } from "@/core/solver";
import { EGeo, TGeo, TID, TSketch } from "@/core/types";
import {
  makeCoincident,
  makeDistance,
  makeHorizontalOrVertical,
  makeParallel,
  makePerpendicular,
  makePointOnCircle,
  makePointOnLine,
  makeRadius,
} from "@/core/utils";

type TEditorStore = {
  scale: number;
  translate: { dx: number; dy: number };
  pointer: { x: number; y: number };

  preselectedGeoId?: TID;
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

  paramsOfSelectedGeo: {
    radius?: number;
    length?: number;
    angle?: number;
    distance?: number;
  };

  init(sketch: TSketch): void;
  reset(): void;

  setScale(scale: number): void;
  moveTranslate(dx: number, dy: number): void;
  setPointer(x: number, y: number): void;

  setPreselectedGeo(id: TID | undefined): void;
  resetGeoSelection(): void;
  toggleGeoSelection(id: TID): void;
  getSelectedGeos(): TGeo[];

  getGeo(id: TID): TGeo;
  getGeoOf<G extends EGeo>(type: G, id: TID): TGeo & { geo: G };

  createCoincident(): void;
  createRadius(): void;
  createDistance(): void;
  createAlign(): void;
  createPerpendicular(): void;
  createParallel(): void;

  _explainSelectedParams(): void;

  _abort(): void;
  _solve(): void;
  _updateGeoMap(): void;
};

const useEditorStore = create<TEditorStore>((set, get) => ({
  scale: 1,
  translate: { dx: 0, dy: 0 },
  pointer: { x: 0, y: 0 },

  selectedGeoIds: [],

  _geoMap: new Map(),

  solvingStats: { error: 0, i: 0, lambda: 0 },
  _solvingController: new AbortController(),

  allowCoincident: false,
  allowPointOnLine: false,
  allowPointOnCircle: false,
  allowRadius: false,

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

  setScale: (scale) => {
    set({ scale });
  },

  moveTranslate: (dx, dy) => {
    set((prev) => ({
      translate: { dx: prev.translate.dx + dx, dy: prev.translate.dy + dy },
    }));
  },

  setPointer: (x, y) => {
    set({ pointer: { x, y } });
  },

  setPreselectedGeo: (id) => {
    set({ preselectedGeoId: id });
  },

  resetGeoSelection: () => {
    set({ selectedGeoIds: [] });
    get()._explainSelectedParams();
  },

  toggleGeoSelection: (id) => {
    set(({ selectedGeoIds: prev }) => {
      if (prev.includes(id)) {
        return { selectedGeoIds: prev.filter((iid) => iid !== id) };
      }

      return { selectedGeoIds: [...prev, id] };
    });
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

  createCoincident: () => {
    const { sketch, getSelectedGeos, resetGeoSelection, _solve } = get();

    if (!sketch) return;

    const selectedGeos = getSelectedGeos();

    if (selectedGeos.length < 2) return;

    const point = selectedGeos.find((g) => g.geo === EGeo.Point);

    if (!point) return;

    const restGeos = selectedGeos.filter((g) => g !== point);

    for (const geo of restGeos) {
      if (geo.geo === EGeo.Point) {
        makeCoincident(sketch, point, geo);
      } else if (geo.geo === EGeo.Segment) {
        makePointOnLine(sketch, point, geo);
      } else if (geo.geo === EGeo.Circle) {
        makePointOnCircle(sketch, point, geo);
      }
    }

    resetGeoSelection();
    _solve();
  },

  createRadius: () => {
    const { sketch, getSelectedGeos, resetGeoSelection, _solve } = get();

    if (!sketch) return;

    const selectedCircles = getSelectedGeos().filter((g) => g.geo === EGeo.Circle);

    if (!selectedCircles.length) return;

    const input = Number(prompt("Radius"));

    if (Number.isNaN(input)) return;

    if (input <= 0) return;

    const r = input;

    for (const geo of selectedCircles) {
      // TODO: вводить радиус первой окружности, остальные приравнивать к ней
      makeRadius(sketch, geo, r);
    }

    resetGeoSelection();
    _solve();
  },

  createDistance: () => {
    const { sketch, getSelectedGeos, resetGeoSelection, _solve, getGeoOf } = get();

    if (!sketch) return;

    const selectedGeos = getSelectedGeos();

    if (!selectedGeos.length) return;

    const [a, b] = selectedGeos;

    const ask = (name: string): number | undefined => {
      const value = Number(prompt(name));

      if (Number.isNaN(value)) return;

      if (value <= 0) return;

      return value;
    };

    if (a.geo === EGeo.Point && b.geo === EGeo.Point) {
      const d = ask("Distance");

      if (d === undefined) return;

      makeDistance(sketch, a, b, d);
    } else if (a.geo === EGeo.Segment) {
      const pa = getGeoOf(EGeo.Point, a.a_id);
      const pb = getGeoOf(EGeo.Point, a.b_id);

      const d = ask("Length");

      if (d === undefined) return;

      makeDistance(sketch, pa, pb, d);
    } else {
      return;
    }

    resetGeoSelection();
    _solve();
  },

  createAlign: () => {
    const { sketch, getSelectedGeos, resetGeoSelection, _solve, getGeoOf } = get();

    if (!sketch) return;

    const selectedGeos = getSelectedGeos();

    if (!selectedGeos.length) return;

    const points = selectedGeos.filter((g) => g.geo === EGeo.Point);
    const segments = selectedGeos.filter((g) => g.geo === EGeo.Segment);

    if (points.length >= 1) {
      const [a, ...rest] = points;

      for (const b of rest) {
        makeHorizontalOrVertical(sketch, a, b);
      }
    }

    for (const segment of segments) {
      const a = getGeoOf(EGeo.Point, segment.a_id);
      const b = getGeoOf(EGeo.Point, segment.b_id);

      makeHorizontalOrVertical(sketch, a, b);
    }

    resetGeoSelection();
    _solve();
  },

  createPerpendicular: () => {
    const { sketch, getSelectedGeos, resetGeoSelection, _solve } = get();

    if (!sketch) return;

    const segments = getSelectedGeos().filter((g) => g.geo === EGeo.Segment);

    if (segments.length !== 2) return;

    const [a, b] = segments;

    makePerpendicular(sketch, a, b);

    resetGeoSelection();
    _solve();
  },

  createParallel: () => {
    const { sketch, getSelectedGeos, resetGeoSelection, _solve } = get();

    if (!sketch) return;

    const segments = getSelectedGeos().filter((g) => g.geo === EGeo.Segment);

    if (segments.length !== 2) return;

    const [a, b] = segments;

    makeParallel(sketch, a, b);

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
