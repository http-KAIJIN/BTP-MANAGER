export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
};
