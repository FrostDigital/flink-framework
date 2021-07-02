import {UserPasswordResetStartRes } from "./UserPasswordResetStartRes";

export interface UserPasswordResetStartResPublic extends Omit<UserPasswordResetStartRes, "code"> {}