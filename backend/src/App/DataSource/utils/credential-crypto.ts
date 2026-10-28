import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { getDataSourceEncryptionKey } from "../../../Helpers/GeneralHelpers";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const key = getDataSourceEncryptionKey();

  const buffer = Buffer.from(key, "base64");

  if (buffer.length !== 32) {
    throw new Error(
      "DATA_SOURCE_ENCRYPTION_KEY doit contenir exactement 32 octets en Base64"
    );
  }

  return buffer;
}

export function encryptCredential(
  plainText: string
): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptCredential(
  encryptedValue: string
): string {
  const [ivBase64, authTagBase64, contentBase64] =
    encryptedValue.split(".");

  if (
    !ivBase64 ||
    !authTagBase64 ||
    !contentBase64
  ) {
    throw new Error(
      "Format du mot de passe chiffré invalide"
    );
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivBase64, "base64")
  );

  decipher.setAuthTag(
    Buffer.from(authTagBase64, "base64")
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(contentBase64, "base64")
    ),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
