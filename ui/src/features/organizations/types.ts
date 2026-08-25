export interface Organization {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrganizationInput {
  name: string;
}

export interface UpdateOrganizationInput {
  name: string;
}
