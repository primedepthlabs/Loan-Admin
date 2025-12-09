// @/lib/cashback.ts

import { supabase } from "@/lib/supabaseClient";

export async function grantInstantCashback(
  paymentId: string,
  agentId: string,
  planId: string,
  paymentAmount: number
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

    /* =====================================================
       ✅ ADD FROM HERE (PLAN LIMIT = MAX DEPTH)
    ===================================================== */

    // 4. Get plan limit from chain settings (MAX DEPTH)
    const { data: chain } = await supabase
      .from("plan_chain_settings")
      .select("max_depth")
      .eq("plan_id", planId)
      .single();

    const planLimit = chain?.max_depth || 50;

    // 5. Existing reward row
    const { data: reward } = await supabase
      .from("agent_plan_rewards")
      .select("id, pairing_completed")
      .eq("agent_id", agentId)
      .eq("plan_id", planId)
      .single();

    const newCompleted = (reward?.pairing_completed || 0) + 1;
    const shouldUnlock = newCompleted >= planLimit;

    if (reward) {
      // update
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
      // create
      await supabase.from("agent_plan_rewards").insert({
        agent_id: agentId,
        plan_id: planId,
        pairing_completed: 1,
        pairing_limit: planLimit,
        locked_amount: cashbackAmount,
        is_released: false,
      });
    }

    /* ===================================================== */

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
