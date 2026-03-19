import { api } from "./api";
import type {
  ManualRelationshipRequest,
  RelationshipResponse,
  ForeignKeyRelationshipRequest,
  TableColumnInfo,
  RelationshipHierarchyResponse,
  TableRelationshipsResponse,
} from "@/types/api";

export const getRelationshipHierarchy = async (): Promise<RelationshipHierarchyResponse> =>
  api.get<RelationshipHierarchyResponse>("/api/relationship/hierarchy");

export const createManualRelationship = async (
  payload: ManualRelationshipRequest,
): Promise<RelationshipResponse> =>
  api.post<RelationshipResponse>("/api/relationship/manual", payload);

export const createForeignKeyRelationship = async (
  payload: ForeignKeyRelationshipRequest,
): Promise<RelationshipResponse> =>
  api.post<RelationshipResponse>("/api/relationship/foreign-key", payload);

export const getTableColumns = async (
  tableName: string,
): Promise<TableColumnInfo[]> =>
  api.get<TableColumnInfo[]>(`/api/relationship/tables/${tableName}/columns`);

export const getTableRelationships = async (
  tableName: string,
  schema: string,
  database: string,
): Promise<TableRelationshipsResponse> => {
  const params = new URLSearchParams({ schema, database });
  return api.get<TableRelationshipsResponse>(
    `/api/relationship/tables/${tableName}/relationships?${params}`,
  );
};