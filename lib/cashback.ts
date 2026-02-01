// @/lib/cashback.ts

import { supabase } from "@/lib/supabaseClient";

export async function grantInstantCashback(
  paymentId: string,
  agentId: string,
  planId: string,
  paymentAmount: number,
) {
  try {
    // 1. Prevent duplicate cashback
    const { data: existingCashback } = await supabase
      .from("agent_cashbacks")
      .select("id")
      .eq("payment_id", paymentId)
      .limit(1);

    if (existingCashback && existingCashback.length > 0) {
      return { success: true, message: "Cashback already granted" };
    }

    // 2. Get cashback percentage from plan
    const { data: plan } = await supabase
      .from("plans")
      .select("cashback_percentage")
      .eq("id", planId)
      .single();

    const cashbackPercentage = plan?.cashback_percentage || 20;
    const cashbackAmount = Math.round(paymentAmount * cashbackPercentage) / 100;

    // 3. Insert cashback
    await supabase.from("agent_cashbacks").insert({
      agent_id: agentId,
      payment_id: paymentId,
      plan_id: planId,
      original_amount: paymentAmount,
      cashback_percentage: cashbackPercentage,
      cashback_amount: cashbackAmount,
      status: "credited",
    });

    return {
      success: true,
      message: `₹${cashbackAmount} cashback credited (${cashbackPercentage}%)`,
    };
  } catch (error) {
    console.error("Cashback grant error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to grant cashback",
    };
  }
}
