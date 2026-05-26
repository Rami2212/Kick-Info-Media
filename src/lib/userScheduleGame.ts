import { getMongoDb } from "@/lib/mongodb";
import { parseScheduleBracketData, type ScheduleBracketSlot } from "@/lib/scheduleBracket";
import { parseScheduleGroupStageData, type ScheduleGroup } from "@/lib/scheduleGroupStage";

type UserScheduleGameDoc = {
  userId: string;
  slots: ScheduleBracketSlot[];
  groups: ScheduleGroup[];
  createdAt: string;
  updatedAt: string;
};

const COLLECTION_NAME = "user_schedule_games";
let indexesEnsured = false;

async function collection() {
  const db = await getMongoDb();
  return db.collection<UserScheduleGameDoc>(COLLECTION_NAME);
}

async function ensureIndexes() {
  if (indexesEnsured) return;
  const col = await collection();
  await col.createIndex({ userId: 1 }, { unique: true });
  await col.createIndex({ updatedAt: -1 });
  indexesEnsured = true;
}

export async function getUserScheduleGame(
  userId: string,
): Promise<{ slots: ScheduleBracketSlot[]; groups: ScheduleGroup[] } | null> {
  await ensureIndexes();
  const col = await collection();
  const doc = await col.findOne({ userId });
  if (!doc) return null;

  const parsedBracket = parseScheduleBracketData({ slots: doc.slots });
  const parsedGroups = parseScheduleGroupStageData({ groups: doc.groups });
  if (!parsedBracket || !parsedGroups) return null;

  return { slots: parsedBracket.slots, groups: parsedGroups.groups };
}

export async function upsertUserScheduleGame(input: {
  userId: string;
  slots: ScheduleBracketSlot[];
  groups: ScheduleGroup[];
}): Promise<{ slots: ScheduleBracketSlot[]; groups: ScheduleGroup[] }> {
  await ensureIndexes();
  const col = await collection();
  const now = new Date().toISOString();

  await col.updateOne(
    { userId: input.userId },
    {
      $setOnInsert: { userId: input.userId, createdAt: now },
      $set: {
        slots: input.slots,
        groups: input.groups,
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  return { slots: input.slots, groups: input.groups };
}
