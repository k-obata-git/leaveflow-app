import { RequestData } from "@/models/requestData";
import { User } from "@/models/user";
import { create } from "zustand";

export interface RequestStore {
  requestData: RequestData,
  selectedApproverIds: [],
  selectedApprovers: User[],
  setRequestData: (requestData: RequestData) => void,
  setSelectedApproverIds: (selectedApproverIds: any) => void,
  setSelectedApprovers: (approvers: User[]) => void,
  getStartDateStr: (split?: string) => string,
  getEndDateStr: (split?: string) => string,
  reset: () => void,
};

const useRequestStore = create<RequestStore>((set, get) => ({
  requestData: {
    id: "",
    requesterId: "",
    title: "",
    reason: "",
    unit: "FULL_DAY",
    startDate: new Date(),
    endDate: new Date(),
    hours: 0,
    status: "DRAFT",
    steps: [],
    requester: {
      id: "",
      name: "",
      email: "",
      role: "USER",
    },
    approverIds: [],
    canApproveReject: false,
    canResubmit: false,
    isDraft: false,
    canWithdraw: false,
    canDelete: false,
    myStepId: null,
    me: {
      id: "",
      role: "USER",
    },
    createdAt: "",
    updatedAt: "",
    logs: [],
  },
  selectedApproverIds: [],
  selectedApprovers: [],
  setSelectedApproverIds: (val) => set(() => ({
    selectedApproverIds: val
  })),
  setSelectedApprovers: (approvers) => set(() => ({
    selectedApprovers: approvers
  })),
  setRequestData: (requestData) => set((state) => ({
    requestData: requestData
  })),
  getStartDateStr: (split) => {
    const sd = new Date(get().requestData.startDate);
    return sd.toLocaleDateString("ja-JP", {year: "numeric", month: "2-digit", day: "2-digit"}).replaceAll('/', split ? split : '-');
  },
  getEndDateStr: (split) => {
    const ed = new Date(get().requestData.endDate);
    return ed.toLocaleDateString("ja-JP", {year: "numeric", month: "2-digit", day: "2-digit"}).replaceAll('/', split ? split : '-');
  },
  reset: () => set(() => ({
    requestData: {
      id: "",
      requesterId: "",
      title: "",
      reason: "",
      unit: "FULL_DAY",
      startDate: new Date(),
      endDate: new Date(),
      hours: 0,
      status: "DRAFT",
      steps: [],
      requester: {
        id: "",
        name: "",
        email: "",
        role: "USER",
      },
      approverIds: [],
      canApproveReject: false,
      canResubmit: false,
      isDraft: false,
      canWithdraw: false,
      canDelete: false,
      myStepId: null,
      me: {
        id: "",
        role: "USER",
      },
      createdAt: "",
      updatedAt: "",
      logs: [],
    },
    selectedApproverIds: [],
    selectedApprovers: [],
  }))
}));

export default useRequestStore;