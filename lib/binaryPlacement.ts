import { supabase } from "@/lib/supabaseClient";

interface PlacementResult {
  success: boolean;
  position?: {
    parent_id: string | null;
    position: string;
    level: number;
    child_slot: number; // 1-5
  };
  error?: string;
}

/**
 * Find the next available position in a tree for a specific plan
 * Supports 1-5 pairing limits dynamically
 */
export async function findNextAvailablePosition(
  sponsorId: string,
  planId: string,
): Promise<PlacementResult> {
  try {
    // Get plan settings (pairing limit, max depth)
    const { data: planSettings } = await supabase
      .from("plan_chain_settings")
      .select("pairing_limit, max_depth")
      .eq("plan_id", planId)
      .maybeSingle();

    const pairingLimit = planSettings?.pairing_limit || 2; // Default binary
    const maxDepth = planSettings?.max_depth || 50;

    // Check if sponsor exists in this plan's tree
    const { data: sponsorPosition } = await supabase
      .from("plan_binary_positions")
      .select("*")
      .eq("agent_id", sponsorId)

      .eq("pairing_limit", pairingLimit)
      .maybeSingle();

    if (!sponsorPosition) {
      return {
        success: false,
        error: "Sponsor is not positioned in this plan's tree",
      };
    }

    // Check if we've reached max depth
    if (sponsorPosition.level >= maxDepth) {
      return {
        success: false,
        error: "Maximum tree depth reached",
      };
    }

    // Check available child slots (1 to pairingLimit)
    for (let slot = 1; slot <= pairingLimit; slot++) {
      const childField = `child_${slot}_id`;
      if (!sponsorPosition[childField]) {
        return {
          success: true,
          position: {
            parent_id: sponsorId,
            position: `child_${slot}`,
            level: sponsorPosition.level + 1,
            child_slot: slot,
          },
        };
      }
    }

    // All slots filled, find next available in downline (breadth-first)
    const nextAvailable = await findNextAvailableInDownline(
      sponsorId,
      planId,
      maxDepth,
      pairingLimit,
    );
    return nextAvailable;
  } catch (error) {
    console.error("Error finding position:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Breadth-first search to find next available position in downline
 */
async function findNextAvailableInDownline(
  rootAgentId: string,
  planId: string,
  maxDepth: number,
  pairingLimit: number,
): Promise<PlacementResult> {
  try {
    // Get all positions in this plan's tree
    const { data: allPositions } = await supabase
      .from("plan_binary_positions")
      .select("*")
      .eq("pairing_limit", pairingLimit)
      .order("level", { ascending: true });

    if (!allPositions || allPositions.length === 0) {
      return { success: false, error: "No positions found" };
    }

    // Build a queue for breadth-first search
    const queue: string[] = [rootAgentId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentAgentId = queue.shift()!;
      if (visited.has(currentAgentId)) continue;
      visited.add(currentAgentId);

      const currentPosition = allPositions.find(
        (p) => p.agent_id === currentAgentId,
      );
      if (!currentPosition) continue;

      // Check if max depth reached
      if (currentPosition.level >= maxDepth) continue;

      // Check all child slots (1 to pairingLimit)
      for (let slot = 1; slot <= pairingLimit; slot++) {
        const childField = `child_${slot}_id`;

        if (!currentPosition[childField]) {
          // Found empty slot!
          return {
            success: true,
            position: {
              parent_id: currentAgentId,
              position: `child_${slot}`,
              level: currentPosition.level + 1,
              child_slot: slot,
            },
          };
        } else {
          // Add child to queue for further searching
          queue.push(currentPosition[childField]);
        }
      }
    }

    return {
      success: false,
      error: "No available positions found in downline",
    };
  } catch (error) {
    console.error("Error in downline search:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function placeAgentInBinaryTree(
  agentId: string,
  planId: string,
  sponsorId: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get pairing limit FIRST
    const { data: planSettings } = await supabase
      .from("plan_chain_settings")
      .select("pairing_limit")
      .eq("plan_id", planId)
      .single();

    const pairingLimit = planSettings?.pairing_limit || 2;

    // Check if agent already in this pairing system (not just this plan)
    const { data: existingInPairing } = await supabase
      .from("plan_binary_positions")
      .select("id")
      .eq("agent_id", agentId)
      .eq("pairing_limit", pairingLimit)
      .maybeSingle();

    if (existingInPairing) {
      console.log("✅ Agent already in pairing system - skipping placement");
      return { success: true };
    }

    // FIX 1: Check if agent already exists in this plan's tree
    const { data: existingPosition } = await supabase
      .from("plan_binary_positions")
      .select("*")
      .eq("agent_id", agentId)
      .eq("plan_id", planId)
      .maybeSingle();

    if (existingPosition) {
      return { success: true }; // Already placed
    }

    // FIX 1: Check if agent owns this plan (source of truth)
    const { data: agentPlan } = await supabase
      .from("agent_plans")
      .select("id")
      .eq("agent_id", agentId)
      .eq("plan_id", planId)
      .maybeSingle();

    if (!agentPlan) {
      return {
        success: false,
        error: "Agent must own the plan before being placed in tree",
      };
    }

    // Handle root placement (no sponsor)
    if (!sponsorId) {
      // ✅ Check if THIS agent already has a root for THIS pairing_limit
      const { data: existingRoot } = await supabase
        .from("plan_binary_positions")
        .select("id")
        .eq("agent_id", agentId) // ← Check THIS agent
        .eq("pairing_limit", pairingLimit) // ← Check THIS pairing limit
        .eq("position", "root")
        .maybeSingle();

      if (existingRoot) {
        console.log("✅ Agent already has root in this pairing system");
        return { success: true }; // Already has root
      }

      // Get tree_owner_id (should be this agent since they're creating root)
      const treeOwnerId = agentId;

      // Create root position
      const { error } = await supabase.from("plan_binary_positions").insert({
        agent_id: agentId,
        plan_id: planId,
        parent_id: null,
        position: "root",
        level: 1,
        pairing_limit: pairingLimit,
        tree_owner_id: treeOwnerId, // ← ADD THIS
      });

      if (error) throw error;
      return { success: true };
    }

    // Check if sponsor has ANY plan with same pairing_limit
    const { data: selectedPlanSettings } = await supabase
      .from("plan_chain_settings")
      .select("pairing_limit")
      .eq("plan_id", planId)
      .single();

    const { data: sponsorPlans } = await supabase
      .from("agent_plans")
      .select("plan_id")
      .eq("agent_id", sponsorId)
      .eq("is_active", true);

    if (!sponsorPlans || sponsorPlans.length === 0) {
      return {
        success: false,
        error: "Sponsor has no active plans",
      };
    }

    const { data: sponsorPlanSettings } = await supabase
      .from("plan_chain_settings")
      .select("pairing_limit")
      .in(
        "plan_id",
        sponsorPlans.map((p) => p.plan_id),
      );

    const hasSamePairingLimit = sponsorPlanSettings?.some(
      (s) => s.pairing_limit === selectedPlanSettings?.pairing_limit,
    );

    if (!hasSamePairingLimit) {
      return {
        success: false,
        error: "Sponsor doesn't have a compatible plan",
      };
    }
    // FIX 1: Check if sponsor exists in THIS plan's tree
    // No auto-insertion - if sponsor not in tree, reject placement
    const { data: sponsorPosition } = await supabase
      .from("plan_binary_positions")
      .select("*")
      .eq("agent_id", sponsorId)
      .eq("pairing_limit", pairingLimit)
      .maybeSingle();

    if (!sponsorPosition) {
      return {
        success: false,
        error: "Sponsor is not positioned in this plan's tree",
      };
    }

    // Sponsor exists in tree, find next available position
    const placementResult = await findNextAvailablePosition(sponsorId, planId);

    if (!placementResult.success || !placementResult.position) {
      return {
        success: false,
        error: placementResult.error || "Could not find available position",
      };
    }

    const { parent_id, position, level, child_slot } = placementResult.position;

    const treeOwnerId = sponsorPosition.tree_owner_id;
    // Insert new position
    const { error: insertError } = await supabase
      .from("plan_binary_positions")
      .insert({
        agent_id: agentId,
        plan_id: planId,
        parent_id: parent_id,
        position: position,
        level: level,
        pairing_limit: pairingLimit,

        tree_owner_id: treeOwnerId,
      });

    if (insertError) throw insertError;

    // Update parent's child_X_id field
    const updateField = `child_${child_slot}_id`;
    const { error: updateError } = await supabase
      .from("plan_binary_positions")
      .update({ [updateField]: agentId })
      .eq("agent_id", parent_id!)

      .eq("pairing_limit", pairingLimit);

    if (updateError) throw updateError;

    // ✅ CHECK IF PARENT'S PAIRING IS NOW COMPLETE
    // ✅ CHECK IF PARENT'S PAIRING IS NOW COMPLETE
    if (parent_id && pairingLimit > 1) {
      await checkAndReleasePairingCommissions(parent_id, pairingLimit);

      // ✅ CHECK IF PARENT COMPLETED PAIRING AND UNLOCK UPLINE LOCKED AMOUNTS
      await checkAndUnlockMaxDepthRewards(parent_id, level, pairingLimit);
    }

    return { success: true };
  } catch (error) {
    console.error("Error placing agent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get the complete tree for a specific plan starting from an agent
 */
export async function getBinaryTreeForPlan(
  agentId: string,
  planId: string,
): Promise<any> {
  try {
    const { data: allPositions, error } = await supabase
      .from("plan_binary_positions")
      .select("*")
      .eq("plan_id", planId);

    // Explicit null/error check
    if (error) {
      console.error("Error fetching positions:", error);
      return null;
    }

    if (
      !allPositions ||
      !Array.isArray(allPositions) ||
      allPositions.length === 0
    ) {
      return null;
    }

    // Now TypeScript knows allPositions is definitely a non-null array
    const positions = allPositions;

    // Build tree recursively
    function buildTree(currentAgentId: string): any {
      if (!positions) return null; // Extra null check for TypeScript

      const position = positions.find((p) => p.agent_id === currentAgentId);
      if (!position) return null;

      // Build children array from child_1 to child_5
      const children: any[] = [];
      for (let i = 1; i <= 5; i++) {
        const childField = `child_${i}_id`;
        if (position[childField]) {
          const child = buildTree(position[childField]);
          if (child) children.push(child);
        }
      }

      return {
        ...position,
        children,
      };
    }

    return buildTree(agentId);
  } catch (error) {
    console.error("Error getting tree:", error);
    return null;
  }
}
/**
 * Check if agent's pairing is complete and release commissions
 */
export async function checkAndReleasePairingCommissions(
  parentAgentId: string,
  pairingLimit: number,
) {
  try {
    console.log(
      `🔍 Checking pairing for agent ${parentAgentId}, limit: ${pairingLimit}`,
    );

    // Get parent's position in the tree
    const { data: parentPosition } = await supabase
      .from("plan_binary_positions")
      .select("*")
      .eq("agent_id", parentAgentId)
      .eq("pairing_limit", pairingLimit)
      .single();

    if (!parentPosition) {
      console.log("⚠️ Parent position not found");
      return;
    }

    // Check if ALL direct child slots are filled
    let filledSlots = 0;
    for (let i = 1; i <= pairingLimit; i++) {
      const childField = `child_${i}_id`;
      if (parentPosition[childField]) {
        filledSlots++;
      }
    }

    console.log(
      `📊 Pairing status: ${filledSlots}/${pairingLimit} slots filled`,
    );

    // If pairing is complete, release commissions
    if (filledSlots === pairingLimit) {
      console.log("✅ Pairing complete! Releasing commissions...");

      const { data: updatedCommissions, error } = await supabase
        .from("commissions")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("from_agent_id", parentAgentId)
        .eq("status", "pending")
        .select();

      if (error) {
        console.error("❌ Error releasing commissions:", error);
      } else {
        console.log(
          `💰 Released ${updatedCommissions?.length || 0} commissions`,
        );
      }
    }
  } catch (error) {
    console.error("❌ Error in checkAndReleasePairingCommissions:", error);
  }
}
/**
 * Check if max_depth reached for upline agents and unlock their locked rewards
 * Called when an agent completes their pairing
 */
async function checkAndUnlockMaxDepthRewards(
  agentId: string,
  agentLevel: number,
  pairingLimit: number,
) {
  try {
    console.log(`🔍 Checking max_depth unlock for agent ${agentId} at level ${agentLevel}`);

    // Check if this agent has completed their pairing
    const { data: agentPosition } = await supabase
      .from("plan_binary_positions")
      .select("*")
      .eq("agent_id", agentId)
      .eq("pairing_limit", pairingLimit)
      .single();

    if (!agentPosition) return;

    // Count filled slots
    let filledSlots = 0;
    for (let i = 1; i <= pairingLimit; i++) {
      if (agentPosition[`child_${i}_id`]) filledSlots++;
    }

    // Only proceed if this agent has completed pairing
    if (filledSlots < pairingLimit) {
      console.log(`⏳ Agent pairing not complete: ${filledSlots}/${pairingLimit}`);
      return;
    }

    console.log(`✅ Agent pairing complete! Checking upline for max_depth unlock...`);

    // Get all upline agents in this tree
    const uplineAgents: string[] = [];
    let currentParentId = agentPosition.parent_id;

    while (currentParentId) {
      uplineAgents.push(currentParentId);
      
      const { data: parentPos } = await supabase
        .from("plan_binary_positions")
        .select("parent_id")
        .eq("agent_id", currentParentId)
        .eq("pairing_limit", pairingLimit)
        .single();

      currentParentId = parentPos?.parent_id || null;
    }

    if (uplineAgents.length === 0) {
      console.log("ℹ️ No upline agents found");
      return;
    }

    console.log(`📊 Found ${uplineAgents.length} upline agents`);

    // Check each upline agent's locked rewards
    for (const uplineAgentId of uplineAgents) {
      // Get all locked rewards for this upline agent
      const { data: lockedRewards } = await supabase
        .from("agent_plan_rewards")
        .select("id, plan_id, locked_amount")
        .eq("agent_id", uplineAgentId)
        .eq("is_released", false);

      if (!lockedRewards || lockedRewards.length === 0) continue;

      // Check each locked reward
      for (const reward of lockedRewards) {
        // Get max_depth for this plan
        const { data: planSettings } = await supabase
          .from("plan_chain_settings")
          .select("max_depth")
          .eq("plan_id", reward.plan_id)
          .single();

        const maxDepth = planSettings?.max_depth || 50;

        // If agent's level >= max_depth, unlock this reward
        if (agentLevel >= maxDepth) {
          console.log(`🎉 Unlocking reward for agent ${uplineAgentId} - max_depth ${maxDepth} reached at level ${agentLevel}`);

          // Create commission for the locked amount
          await supabase.from("commissions").insert({
            agent_id: uplineAgentId,
            from_agent_id: agentId,
            plan_id: reward.plan_id,
            commission_amount: reward.locked_amount,
            original_amount: reward.locked_amount,
            level: 0,
            status: "paid",
            payment_id: null,
            paid_at: new Date().toISOString(),
          });

          // Mark reward as released
          await supabase
            .from("agent_plan_rewards")
            .update({
              is_released: true,
              released_at: new Date().toISOString(),
            })
            .eq("id", reward.id);

          console.log(`💰 Released ₹${reward.locked_amount} for agent ${uplineAgentId}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error in checkAndUnlockMaxDepthRewards:", error);
  }
}