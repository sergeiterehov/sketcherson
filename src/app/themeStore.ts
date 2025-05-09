import { create } from "zustand";

type TThemeStore = {
  theme: {
    background: string;

    oxColor: string;
    oyColor: string;

    selectedColor: string;
    preselectedColor: string;
    creatingColor: string;

    lineColor: string;
    lineWidth: number;
    pointColor: string;
    pointRadius: number;
    constraintColor: string;

    hitColor: string;
    interactiveStrokeWidth: number;
    interactivePointRadius: number;
  };

  shortcuts: {
    cancel: string;

    point: string;
    segment: string;
    circle: string;

    coincident: string;
    radius: string;
    distance: string;
    align: string;
    perpendicular: string;
    parallel: string;
    angle: string;
  };
};

const useThemeStore = create<TThemeStore>(() => ({
  theme: {
    background: "#F6F6F6",
    oxColor: "#F008",
    oyColor: "#0F08",
    selectedColor: "#08F",
    preselectedColor: "#0AF",
    creatingColor: "#0D4",
    lineColor: "#666",
    pointColor: "#333",
    constraintColor: "#D77",
    hitColor: "#00F0",
    lineWidth: 1,
    pointRadius: 2,
    interactiveStrokeWidth: 8,
    interactivePointRadius: 5,
  },

  shortcuts: {
    cancel: "Escape",
    point: "p",
    segment: "s",
    circle: "c",
    coincident: "x",
    radius: "r",
    distance: "d",
    angle: "a",
    align: "l",
    perpendicular: "t",
    parallel: "i",
  },
}));

export default useThemeStore;
