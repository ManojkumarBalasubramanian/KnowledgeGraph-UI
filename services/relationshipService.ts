import { api } from "./api";
import type {
  ManualRelationshipRequest,
  RelationshipResponse,
} from "@/types/api";

export const createManualRelationship = async (
  payload: ManualRelationshipRequest,
): Promise<RelationshipResponse> =>
  api.post<RelationshipResponse>("/api/relationship/manual", payload);