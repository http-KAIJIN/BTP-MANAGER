export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  preferredLanguage: string;
  status: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  roles: { code: string; name: string }[];
  permissions: string[];
};
