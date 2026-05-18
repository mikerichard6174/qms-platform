export type UserProgramAssignmentRecord = {
  id: string;
  tenant_id: string;
  user_id: string;
  program_id: string;
  created_at: string;
  updated_at: string;
};

export type UserProgramAssignmentListResponse = {
  items: UserProgramAssignmentRecord[];
  total: number;
};