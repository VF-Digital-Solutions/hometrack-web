export type HouseholdType = "INDIVIDUAL" | "FAMILY" | "COMMUNITY";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface HouseholdNode {
  id: string;
  name: string;
  description: string;
  type: HouseholdType;
  parent: string | null;
  avatar_url: string | null;
  address: Record<string, unknown>;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMemberUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface HouseholdMembership {
  id: string;
  user: HouseholdMemberUser;
  node: string;
  role: MemberRole;
  nickname: string | null;
  joined_at: string;
  left_at: string | null;
}

export interface HouseholdInvitation {
  id: string;
  node: string;
  invited_email: string;
  role: MemberRole;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}
