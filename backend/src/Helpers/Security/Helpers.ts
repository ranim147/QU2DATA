import bcrypt from "bcrypt";
import { UserAttributes, UserInstance } from "../../App/User/model/user.model";
import jwt from "jsonwebtoken";
import * as path from "path";
import * as fs from "fs";
import { User } from "../../App/User/model";

export interface DecodedToken {
  userId: string;
  userEmail: string;
}

export interface RefreshTokenDecoded {
  userId: string;
}

const configPath = path.join(__dirname, "../../", "Config", "config.json");

let config;

try {
  const configData = fs.readFileSync(configPath, "utf-8");
  config = JSON.parse(configData);
} catch (error) {
  console.error("Error reading config.json:", error);
  process.exit(1);
}
const { secretKey } = config;

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    throw new Error("Error comparing passwords");
  }
}

export function generateBearerToken(user: UserAttributes): string {
  const payload = {
    userId: user.id,
    userEmail: user.email,
  };
  const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });
  return `Bearer ${token}`;
}

export function generateRefreshToken(userId: string): string {
  const payload = { userId };
  return jwt.sign(payload, secretKey, { expiresIn: "7d" });
}

export interface EmailValidationDecoded {
  userId: string;
  purpose: string;
}

export function generateEmailValidationToken(userId: string): string {
  const payload: EmailValidationDecoded = {
    userId,
    purpose: "email_validation",
  };
  return jwt.sign(payload, secretKey, { expiresIn: "24h" });
}

export function verifyEmailValidationToken(
  token: string
): EmailValidationDecoded | null {
  try {
    const decoded = jwt.verify(token, secretKey) as EmailValidationDecoded;
    if (decoded.purpose !== "email_validation") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenDecoded | null {
  try {
    return jwt.verify(token, secretKey) as RefreshTokenDecoded;
  } catch {
    return null;
  }
}

export async function decode(
  bearerToken: string
): Promise<UserInstance | null> {
  try {
    const token = bearerToken.split(" ")[1];
    const decoded = jwt.verify(token, secretKey) as DecodedToken;
    return await User.findByPk(decoded.userId);
  } catch {
    return null;
  }
}
