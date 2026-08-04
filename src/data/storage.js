const DATA_KEY = "lean-fitness-react-data-v1";
const SETTINGS_KEY = "lean-fitness-react-settings-v1";

export const todayKey = () => new Date().toLocaleDateString("en-CA");

export function loadData() {
  try { return JSON.parse(localStorage.getItem(DATA_KEY)) || {}; }
  catch { return {}; }
}

export function saveData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export const defaultSettings = {
  heightFeet: 5,
  heightInches: 2,
  weight: 161.2,
  age: 33,
  sex: "male",
  activity: 1.55,
  goal: "lean",
  calories: 2050,
  protein: 165,
  water: 11
};

export function loadSettings() {
  try { return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) }; }
  catch { return { ...defaultSettings }; }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function blankDay(defaultPlan) {
  return {
    selectedMeals: [...defaultPlan],
    completedMeals: {},
    waterCups: 0,
    weight: null,
    workout: false,
    movement: false,
    notes: ""
  };
}


export function normalizeDay(value, defaultPlan) {
  const fallback = blankDay(defaultPlan);
  if (!value || typeof value !== "object") return fallback;

  return {
    selectedMeals: Array.isArray(value.selectedMeals)
      ? value.selectedMeals.filter((id) => typeof id === "string")
      : [...defaultPlan],
    completedMeals:
      value.completedMeals && typeof value.completedMeals === "object"
        ? value.completedMeals
        : {},
    waterCups: Number.isFinite(Number(value.waterCups))
      ? Math.max(0, Number(value.waterCups))
      : 0,
    weight:
      value.weight === null || value.weight === "" || value.weight === undefined
        ? null
        : Number(value.weight),
    workout: Boolean(value.workout),
    movement: Boolean(value.movement),
    notes: typeof value.notes === "string" ? value.notes : ""
  };
}
