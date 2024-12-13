"use server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountTable } from "@/db/schema";

/**
 * Updates an existing user's login information
 * @param {string} userName - The user's username
 * @param {string} profileImage - The URL of the user's profile image
 * @param {string} walletAddress - The user's wallet address
 * @returns {Promise<{success: boolean, error?: string|Error}>} Result of the update operation
 */
export async function updateExistingLogin(userName, profileImage, walletAddress) {
  try {
    // Remove username normalization to match exact casing
    const result = await db
      .update(accountTable)
      .set({
        profileImage,
        walletAddress,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(accountTable.userName, userName))
      .execute();

    if (result.rowsAffected === 0) {
      console.log("No user found with username:", userName);
      return { success: false, error: "User not found" };
    }

    console.log("Login info updated:", { userName, profileImage });
    return { success: true };
  } catch (error) {
    console.error("Error updating login:", error);
    return { success: false, error: error?.message || "Failed to update login" };
  }
}
