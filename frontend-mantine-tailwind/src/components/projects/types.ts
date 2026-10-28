export interface ObjectiveOption {
  value: string;
  labelKey: string;
}

export const OBJECTIVE_OPTIONS: ObjectiveOption[] = [
  { value: "explore", labelKey: "objective_explore" },
  { value: "kpi", labelKey: "objective_kpi" },
  { value: "anomaly", labelKey: "objective_anomaly" },
  { value: "present", labelKey: "objective_present" },
];

export interface InviteEntry {
  email: string;
}

export interface ProjectFormValues {
  name: string;
  description: string;
  domain: string;
  objective: string | null;
  invites: InviteEntry[];
}

export const INITIAL_PROJECT_FORM_VALUES: ProjectFormValues = {
  name: "",
  description: "",
  domain: "",
  objective: null,
  invites: [],
};