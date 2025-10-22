export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  role: 'user' | 'admin';
}

export interface Tenant {
  id: string;
  owner_id: number;
  company_name: string;
  plan: 'free' | 'basic' | 'premium';
  created_at: string;
  updated_at: string;
  domains?: Domain[];
}

export interface Domain {
  id: number;
  domain: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export interface CreateTenantRequest {
  company_name: string;
  subdomain: string;
  plan?: 'free' | 'basic' | 'premium';
}

