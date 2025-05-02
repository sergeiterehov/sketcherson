import { create } from "zustand";

type TThemeStore = {
  theme: {
    oxColor: string;
    oyColor: string;
    selectedColor: string;
    lineColor: string;
    pointColor: string;
    constraintColor: string;
    lineWidth: number;
    pointRadius: number;
  };
};

const useThemeStore = create<TThemeStore>(() => ({
  theme: {
    oxColor: "#F008",
    oyColor: "#0F08",
    selectedColor: "#F00",
    lineColor: "#777",
    pointColor: "#444",
    constraintColor: "#D77",
    lineWidth: 1,
    pointRadius: 2,
  },
}));

export default useThemeStore;
