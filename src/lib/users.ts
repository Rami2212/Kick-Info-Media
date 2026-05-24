import { randomUUID, randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getMongoDb } from "@/lib/mongodb";

export type Gender = "male" | "female" | "couple" | "transgender";
export type UserRole = "user" | "admin";

export interface PublicUserProfile {
  id: string;
  username: string;
  email?: string;
  firstName: string;
  lastName: string;
  bio: string;
  birthday: string;
  gender: Gender | "";
  profileImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDoc extends PublicUserProfile {
  email: string;
  passwordHash?: string;
  googleId?: string;
  displayName: string;
  name?: string;
  country?: string;
  phone?: string;
  membership?: string;
  role?: UserRole;
}

type UserInput = {
  username: string;
  email: string;
  password: string;
};

type ProfileUpdateInput = {
  firstName?: string;
  lastName?: string;
  bio?: string;
  birthday?: string;
  gender?: Gender | "";
  profileImageUrl?: string;
};

let indexesEnsured = false;

function usersCollection() {
  return getMongoDb().then((db) => db.collection<UserDoc>("users"));
}

async function ensureUserIndexes() {
  if (indexesEnsured) return;
  const col = await usersCollection();
  await col.createIndex({ username: 1 }, { unique: true });
  await col.createIndex({ email: 1 }, { unique: true });
  await col.createIndex({ createdAt: -1 });
  indexesEnsured = true;
}

function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

function normalizeUsername(input: string) {
  return input.trim();
}

function normalizeLooseText(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
}

export function isValidUsername(input: string) {
  return /^[a-zA-Z0-9_]{2,20}$/.test(input.trim());
}

export function toPublicProfile(user: UserDoc): PublicUserProfile {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    bio: user.bio || "",
    birthday: user.birthday || "",
    gender: user.gender || "",
    profileImageUrl: user.profileImageUrl || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getUserByEmail(email: string) {
  await ensureUserIndexes();
  const col = await usersCollection();
  return col.findOne({ email: normalizeEmail(email) });
}

export async function getUserByUsername(username: string) {
  await ensureUserIndexes();
  const col = await usersCollection();
  return col.findOne({ username: normalizeUsername(username) });
}

export async function getUserById(id: string) {
  await ensureUserIndexes();
  const col = await usersCollection();
  return col.findOne({ id });
}

const scryptAsync = promisify(scryptCb);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [salt, expectedHex] = encoded.split(":");
  if (!salt || !expectedHex) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function createUserWithPassword(input: UserInput): Promise<UserDoc> {
  await ensureUserIndexes();
  const email = normalizeEmail(input.email);
  const username = normalizeUsername(input.username);

  const existingByEmail = await getUserByEmail(email);
  if (existingByEmail) throw new Error("Email already in use");

  const existingByUsername = await getUserByUsername(username);
  if (existingByUsername) throw new Error("Username already in use");

  const passwordHash = await hashPassword(input.password);
  const now = new Date().toISOString();
  const doc: UserDoc = {
    id: randomUUID(),
    username,
    email,
    passwordHash,
    displayName: username,
    name: "",
    country: "",
    phone: "",
    membership: "",
    firstName: "",
    lastName: "",
    bio: "",
    birthday: "",
    gender: "",
    profileImageUrl: "",
    role: "user",
    createdAt: now,
    updatedAt: now,
  };

  const col = await usersCollection();
  await col.insertOne(doc);
  return doc;
}

export async function verifyUserPassword(email: string, password: string): Promise<UserDoc | null> {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  return ok ? user : null;
}

export async function upsertGoogleUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
  googleId?: string | null;
}) {
  await ensureUserIndexes();
  const col = await usersCollection();
  const email = normalizeEmail(params.email);
  const existing = await col.findOne({ email });
  const now = new Date().toISOString();

  if (existing) {
    await col.updateOne(
      { id: existing.id },
      {
        $set: {
          googleId: params.googleId || existing.googleId,
          displayName: params.name || existing.displayName,
          profileImageUrl: params.image || existing.profileImageUrl,
          updatedAt: now,
        },
      },
    );
    return (await col.findOne({ id: existing.id })) as UserDoc;
  }

  const base = params.name?.toLowerCase().replace(/[^a-z0-9_]/g, "") || email.split("@")[0] || "user";
  let username = base.slice(0, 16) || "user";
  let suffix = 0;
  while (await col.findOne({ username })) {
    suffix += 1;
    username = `${base.slice(0, 12)}${suffix}`;
  }

  const doc: UserDoc = {
    id: randomUUID(),
    username,
    email,
    googleId: params.googleId || undefined,
    displayName: params.name || username,
    firstName: "",
    lastName: "",
    bio: "",
    birthday: "",
    gender: "",
    profileImageUrl: params.image || "",
    role: "user",
    createdAt: now,
    updatedAt: now,
  };

  await col.insertOne(doc);
  return doc;
}

export async function updateUserProfileById(id: string, updates: ProfileUpdateInput) {
  const col = await usersCollection();
  const next: ProfileUpdateInput & { updatedAt: string } = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof updates.firstName === "string") next.firstName = updates.firstName.trim();
  if (typeof updates.lastName === "string") next.lastName = updates.lastName.trim();
  if (typeof updates.bio === "string") next.bio = updates.bio.trim();
  if (typeof updates.birthday === "string") next.birthday = updates.birthday;
  if (typeof updates.gender === "string") next.gender = updates.gender;
  if (typeof updates.profileImageUrl === "string") next.profileImageUrl = updates.profileImageUrl;

  await col.updateOne({ id }, { $set: next });
  return col.findOne({ id });
}

export async function createUserProfile(input: {
  username: string;
  email: string;
  password?: string;
  name?: string;
  profileImageUrl?: string;
  country?: string;
  phone?: string;
  membership?: string;
}): Promise<UserDoc> {
  await ensureUserIndexes();
  const email = normalizeEmail(input.email);
  const username = normalizeUsername(input.username);

  const existingByEmail = await getUserByEmail(email);
  if (existingByEmail) throw new Error("Email already in use");

  const existingByUsername = await getUserByUsername(username);
  if (existingByUsername) throw new Error("Username already in use");

  const now = new Date().toISOString();
  const passwordHash = input.password ? await hashPassword(input.password) : undefined;
  const name = normalizeLooseText(input.name);

  const doc: UserDoc = {
    id: randomUUID(),
    username,
    email,
    passwordHash,
    displayName: name || username,
    name: name || "",
    country: normalizeLooseText(input.country),
    phone: normalizeLooseText(input.phone),
    membership: normalizeLooseText(input.membership),
    firstName: "",
    lastName: "",
    bio: "",
    birthday: "",
    gender: "",
    profileImageUrl: normalizeLooseText(input.profileImageUrl),
    role: "user",
    createdAt: now,
    updatedAt: now,
  };

  const col = await usersCollection();
  await col.insertOne(doc);
  return doc;
}

export async function updateAdminUserById(
  id: string,
  updates: {
    username?: string;
    email?: string;
    password?: string;
    name?: string;
    profileImageUrl?: string;
    country?: string;
    phone?: string;
    membership?: string;
  },
): Promise<UserDoc | null> {
  await ensureUserIndexes();
  const col = await usersCollection();
  const current = await col.findOne({ id });
  if (!current) return null;

  const next: Partial<UserDoc> & { updatedAt: string } = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof updates.email === "string" && updates.email.trim()) {
    const email = normalizeEmail(updates.email);
    if (email !== current.email) {
      const existingByEmail = await getUserByEmail(email);
      if (existingByEmail) throw new Error("Email already in use");
      next.email = email;
    }
  }

  if (typeof updates.username === "string" && updates.username.trim()) {
    const username = normalizeUsername(updates.username);
    if (username !== current.username) {
      const existingByUsername = await getUserByUsername(username);
      if (existingByUsername) throw new Error("Username already in use");
      next.username = username;
    }
  }

  if (typeof updates.password === "string" && updates.password) {
    next.passwordHash = await hashPassword(updates.password);
  }

  if (typeof updates.name === "string") {
    const name = normalizeLooseText(updates.name);
    next.name = name;
    if (name) next.displayName = name;
  }

  if (typeof updates.profileImageUrl === "string") {
    next.profileImageUrl = normalizeLooseText(updates.profileImageUrl);
  }

  if (typeof updates.country === "string") next.country = normalizeLooseText(updates.country);
  if (typeof updates.phone === "string") next.phone = normalizeLooseText(updates.phone);
  if (typeof updates.membership === "string") next.membership = normalizeLooseText(updates.membership);

  const result = await col.findOneAndUpdate(
    { id },
    { $set: next },
    { returnDocument: "after" },
  );

  return result as UserDoc | null;
}

export async function listPublicUsers(limit = 60): Promise<PublicUserProfile[]> {
  await ensureUserIndexes();
  const col = await usersCollection();
  const docs = await col
    .find(
      {
        username: { $not: /^anon_/i },
      },
      {
        projection: {
          id: 1,
          username: 1,
          firstName: 1,
          lastName: 1,
          bio: 1,
          birthday: 1,
          gender: 1,
          profileImageUrl: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) => toPublicProfile(doc as UserDoc));
}

export async function listAllPublicUsers(): Promise<PublicUserProfile[]> {
  await ensureUserIndexes();
  const col = await usersCollection();
  const docs = await col
    .find(
      {
        username: { $not: /^anon_/i },
      },
      {
        projection: {
          id: 1,
          username: 1,
          firstName: 1,
          lastName: 1,
          bio: 1,
          birthday: 1,
          gender: 1,
          profileImageUrl: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) => toPublicProfile(doc as UserDoc));
}
