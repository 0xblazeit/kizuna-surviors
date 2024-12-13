import { NextRequest, NextResponse } from "next/server";
import { createAlchemyWeb3 } from "@alch/alchemy-web3";

const MOCK_BALANCE = "69.6969"; // Mock balance returned on error

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  const walletAddress = req.nextUrl.searchParams.get("wallet");

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Wallet address is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const web3 = createAlchemyWeb3(
      `https://shape-mainnet.g.alchemy.com/v2/${apiKey}`
    );

    const balance = await web3.eth.getBalance(walletAddress);
    const balanceEth = web3.utils.fromWei(balance, "ether");

    return NextResponse.json(
      { balance: Number(balanceEth).toFixed(4) },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    console.warn("Returning mock balance for development");
    return NextResponse.json(
      { balance: MOCK_BALANCE },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
