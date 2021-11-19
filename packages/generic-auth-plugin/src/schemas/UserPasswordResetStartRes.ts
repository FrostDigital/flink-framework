import { UserProfile } from "./UserProfile";

export interface UserPasswordResetStartRes {
  status: "success" | "userNotFound";
  passwordResetToken?: string;
  code?: string;
  profile?: UserProfile;
}
