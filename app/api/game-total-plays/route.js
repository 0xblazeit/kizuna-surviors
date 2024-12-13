import { NextResponse } from "next/server";
import { db } from "../../../db";
import { gameStats } from "../../../db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const [result] = await db
      .select({
        count: sql`cast(count(*) as integer)`,
      })
      .from(gameStats);

    return NextResponse.json({ count: result.count });
  } catch (error) {
    console.error("Error fetching total game plays:", error);
    return NextResponse.json({ error: "Failed to fetch total game plays" }, { status: 500 });
  }
}
