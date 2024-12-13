"use server";
import { db } from "../db";
import { accountTable } from "../db/schema";

/**
 * Inserts a new login record into the account table
 * @param {string} userName - The user's username
 * @param {string} profileImage - The URL of the user's avatar
 * @param {string} walletAddress - The user's wallet address
 * @throws {Error} If the insertion fails
 */
export async function insertNewLogin(userName, profileImage, walletAddress) {
  try {
    // Keep original casing for userName to match update function
    console.log("Inserting new login..", { userName, profileImage, walletAddress });
    const newLogin = await db.insert(accountTable).values({
      userName,
      profileImage,
      walletAddress,
    });
    console.log("New login inserted!", newLogin);
    return newLogin;
  } catch (error) {
    console.error("Error inserting new login:", error);
    throw new Error(error?.message || "Failed to insert new login");
  }
}
