import { create } from "zustand";

type TThemeStore = {
  theme: {
    oxColor: string;
    oyColor: string;
    selectedColor: string;
    preselectedColor: string;
    lineColor: string;
    pointColor: string;
    constraintColor: string;
    lineWidth: number;
    pointRadius: number;
    hitColor: string;
    interactiveStrokeWidth: number;
    interactivePointRadius: number;
  };

  shortcuts: {
    cancel: string;
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
    oxColor: "#F008",
    oyColor: "#0F08",
    selectedColor: "#08F",
    preselectedColor: "#0AF",
    lineColor: "#777",
    pointColor: "#444",
    constraintColor: "#D77",
    hitColor: "#00F0",
    lineWidth: 1,
    pointRadius: 2,
    interactiveStrokeWidth: 8,
    interactivePointRadius: 5,
  },

  shortcuts: {
    cancel: "Escape",
    coincident: "x",
    radius: "r",
    distance: "d",
    angle: "a",
    align: "t",
    perpendicular: "l",
    parallel: "i",
  },
}));

export default useThemeStore;
