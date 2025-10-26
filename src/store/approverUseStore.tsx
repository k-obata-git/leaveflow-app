import { User } from "@/models/user";
import { create } from "zustand";

export interface ApproverStore {
  approvers: User[],
  setApprovers: (approvers: User[]) => void,
  reset: () => void,
};

const useApproverStore = create<ApproverStore>((set, get) => ({
  approvers: [],
  setApprovers: (ap) => set(() => ({
    approvers: ap
  })),
  reset: () => set(() => ({
    approvers: []
  }))
}));

export default useApproverStore;