import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

export async function POST(req: NextRequest) {
  try {
    const { response } = await req.json();

    const decodedResponse = Buffer.from(response, "base64").toString("utf-8");
    const responseData = JSON.parse(decodedResponse);

    const { transactionId, merchantId, amount, paymentOutcome } = responseData.data;
    const status = paymentOutcome.code;

    // Verify checksum
    const checksum = req.headers.get("X-VERIFY");
    const expectedChecksum =
      crypto.createHash("sha256").update(response + PHONEPE_SALT_KEY).digest("hex") +
      `###${PHONEPE_SALT_INDEX}`;

    if (checksum !== expectedChecksum) {
      console.error("Checksum mismatch for PhonePe callback.");
      return NextResponse.json({ success: false, message: "Checksum mismatch" }, { status: 400 });
    }

    console.log("PhonePe Callback Received:", { transactionId, merchantId, amount, status });

    // TODO: Update user's subscription status in your database based on `status`
    if (status === "PAYMENT_SUCCESS") {
      console.log(`Payment successful for transaction ${transactionId}. User subscription updated.`);
      // Here you would typically update your database to reflect the successful payment
    } else if (status === "PAYMENT_PENDING") {
      console.log(`Payment pending for transaction ${transactionId}. Awaiting final confirmation.`);
    } else {
      console.log(`Payment failed or cancelled for transaction ${transactionId}. Status: ${status}`);
    }

    return NextResponse.json({ success: true, message: "Callback processed" });
  } catch (error) {
    console.error("Error processing PhonePe callback:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process callback" },
      { status: 500 }
    );
  }
}


