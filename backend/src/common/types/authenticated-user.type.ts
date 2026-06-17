export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  preferredLanguage: string;
  roles: string[];
  permissions: string[];
};
