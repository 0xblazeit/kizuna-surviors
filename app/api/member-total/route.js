import { NextResponse } from "next/server";
import { db } from "@/db";
import { accountTable } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.select().from(accountTable).all();
    const count = result.length;
    console.log("Number of rows accountTable:", count);

    const response = NextResponse.json({ count });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Error fetching member count:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch member count" }, { status: 500 });
  }
}
