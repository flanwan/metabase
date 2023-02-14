import { SearchModelType, CardDisplayType } from "metabase-types/api";

export type LinkEntity = {
  id: number;
  name: string;
  model: SearchModelType;
  description?: string;
  display?: CardDisplayType;
  database_id?: number;
  table_id?: number;
};
