import { create } from "zustand";

type ViewKey = "basic" | "history" | "logs";

export interface CommonStore {
  view: ViewKey,
  setView: (view: ViewKey) => void,
  reset: () => void,
};

const useCommonStore = create<CommonStore>((set, get) => ({
  view: "basic",
  setView: (val) => set(() => ({
    view: val
  })),
  reset: () => set(() => ({
    view: "basic",
  }))
}));

export default useCommonStore;