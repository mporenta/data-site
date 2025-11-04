// This file is auto-generated. Do not edit manually.
// Run `npm run sync:types` to regenerate.

export type DashboardMetadata = {
  id: string;
  name: string;
  description: string;
  groups: string[];
  kpis: string[];
};
export type DashboardMetadataListResponse = {
  dashboards: DashboardMetadata[];
  count: number;
};
export type QueryData = {
  columns: string[];
  rows: Record<string, string | number | boolean | null>[];
  count: number;
};
export type QueryResponse = {
  report_id: string;
  data: QueryData;
  source: string;
  message: string;
};
