import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// TODO: Replace with your actual Merchant ID, Salt Key, and Salt Index from PhonePe Business Portal
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "PGTESTMERCHANT";
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
const PHONEPE_API_BASE_URL = process.env.PHONEPE_API_BASE_URL || "https://api-preprod.phonepe.com/apis/pg-ind-preprod/v1/pay";

export async function POST(req: NextRequest) {
  try {
    const { amount, planName, userId } = await req.json();

    if (!amount || !planName || !userId) {
      return NextResponse.json(
        { error: "Missing amount, planName, or userId" },
        { status: 400 }
      );
    }

    const merchantTransactionId = crypto.randomUUID(); // Unique transaction ID
    const host = req.headers.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

    const redirectUrl = `${protocol}://${host}/pricing?transactionId=${merchantTransactionId}`;
    const callbackUrl = `${protocol}://${host}/api/phonepe/callback`; // Will create this later

    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      amount: amount * 100, // Amount in paisa
      redirectUrl: redirectUrl,
      redirectMode: "REDIRECT",
      callbackUrl: callbackUrl,
      mobileNumber: "9999999999", // TODO: Replace with actual user's mobile number or get from auth
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum =
      crypto.createHash("sha256").update(base64Payload + "/pg/v1/pay" + PHONEPE_SALT_KEY).digest("hex") +
      `###${PHONEPE_SALT_INDEX}`;

    const response = await fetch(PHONEPE_API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ url: data.data.instrumentResponse.redirectInfo.url });
    } else {
      console.error("PhonePe API Error:", data);
      return NextResponse.json({ error: data.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}


