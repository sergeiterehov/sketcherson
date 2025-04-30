import { create } from "zustand";
import { SketchSolver } from "./solver";
import { EGeo, TGeo, TID, TSketch } from "./types";
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

  init(sketch: TSketch): void;
  reset(): void;

  setScale(scale: number): void;

  resetGeoSelection(): void;
  toggleGeoSelection(id: number): void;
  getSelectedGeos(): TGeo[];

  getGeo(id: number): TGeo;

  _updateCoincidentAllows(): void;
  createCoincident(): void;
  createPointOnLine(): void;
  createPointOnCircle(): void;

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
  },

  toggleGeoSelection: (id) => {
    set(({ selectedGeoIds: prev }) => {
      if (prev.includes(id)) {
        return { selectedGeoIds: prev.filter((iid) => iid !== id) };
      }

      return { selectedGeoIds: [...prev, id] };
    });
    get()._updateCoincidentAllows();
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
