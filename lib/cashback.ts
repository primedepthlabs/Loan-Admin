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

    // 2. Calculate cashback
    const cashbackPercentage = 20;
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

    // 4. Get plan limit from chain settings (MAX DEPTH)
    const { data: chain } = await supabase
      .from("plan_chain_settings")
      .select("max_depth")
      .eq("plan_id", planId)
      .single();

    const planLimit = chain?.max_depth || 50;

    // 5. ✅ UPDATE existing reward row (trigger already created it)
    // Don't try to insert - just update
    const { data: reward } = await supabase
      .from("agent_plan_rewards")
      .select("id, pairing_completed")
      .eq("agent_id", agentId)
      .eq("plan_id", planId)
      .maybeSingle();

    if (reward) {
      const newCompleted = (reward.pairing_completed || 0) + 1;
      const shouldUnlock = newCompleted >= planLimit;

      await supabase
        .from("agent_plan_rewards")
        .update({
          pairing_completed: newCompleted,
          pairing_limit: planLimit,
          is_released: shouldUnlock,
          released_at: shouldUnlock ? new Date().toISOString() : null,
        })
        .eq("id", reward.id);
    } else {
      // This shouldn't happen since trigger creates it, but log if it does
      console.warn(
        "⚠️ agent_plan_rewards record not found - trigger may have failed",
      );
    }

    return {
      success: true,
      message: `₹${cashbackAmount} cashback credited`,
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
