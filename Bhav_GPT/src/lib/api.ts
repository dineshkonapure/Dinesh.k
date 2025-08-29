// Bhav_GPT/src/lib/api.ts
const API = "/api";

export const fetchOriginal = (date: string, source: "amfi" | "nse" | "bse" | "pr") =>
  fetch(`${API}/fetch-source?date=${date}&source=${source}`);

export const convert = (date: string, target: "amfi" | "all_mkt" | "pr_extracted") =>
  fetch(`${API}/convert?date=${date}&target=${target}`);

export const openAll = (date: string, type: "original" | "processed", mode: "tabs" | "zip") =>
  fetch(`${API}/open-all?date=${date}&type=${type}&mode=${mode}`);

export const status = () =>
  fetch(`${API}/status`).then((r) => r.json());

// Expose the manual-convert endpoint (serverless function name uses underscore)
export const convertUpload = (form: FormData) =>
  fetch(`${API}/convert_upload`, { method: "POST", body: form });
