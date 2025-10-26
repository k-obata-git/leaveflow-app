export type UnitKey = "FULL_DAY" | "HALF_DAY" | "HOURLY";

interface Unit {
  key: UnitKey;
  label: "全日" | "半日" | "時間";
}

export const requestUnit: Unit[] = [
  {
    key: "FULL_DAY",
    label: "全日",
  },
  {
    key: "HALF_DAY",
    label: "半日",
  },
  {
    key: "HOURLY",
    label: "時間",
  },
]

export function getRequestUnitItem(key: UnitKey) {
  return requestUnit.find((ru) => ru.key === key);
}
