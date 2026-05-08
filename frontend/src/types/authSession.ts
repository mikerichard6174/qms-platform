export type AuthRole = {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  program_id: string | null;
};

export type AuthSession = {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  user_id: string;
  email: string;
  full_name: string;
  roles: AuthRole[];
};