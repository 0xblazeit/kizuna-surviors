import { NextResponse } from "next/server";
import { db } from "../../../db";
import { gameStats } from "../../../db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get top 10 results and total count in parallel
    const [results, [countResult]] = await Promise.all([
      db.select().from(gameStats).orderBy(desc(gameStats.gold)).limit(20),
      db
        .select({
          count: sql`cast(count(*) as integer)`,
        })
        .from(gameStats),
    ]);

    return NextResponse.json(
      {
        totalGames: countResult.count,
        data: results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Failed to retrieve game results" }, { status: 500 });
  }
}
