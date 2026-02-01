"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, XCircle, Eye, X } from "lucide-react";
import { placeAgentInBinaryTree } from "@/lib/binaryPlacement";
import { calculateCommissions } from "@/lib/commissionCalculation";
import { grantInstantCashback } from "@/lib/cashback";

interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  payment_screenshot_url: string;
  payment_amount: number;
  payment_status: string;
  submitted_at: string;
  referral_code?: string;
  user_name?: string;
  user_email?: string;
  plan_name?: string;
}

export default function CoursePayment() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("course_payments")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (filter !== "all") query = query.eq("payment_status", filter);

      const { data, error } = await query;
      if (error) throw error;

      if (!data?.length) {
        setPayments([]);
        return;
      }

      const userIds = [...new Set(data.map((p) => p.user_id))];
      const planIds = [...new Set(data.map((p) => p.plan_id))];

      const { data: users } = await supabase
        .from("users")
        .select("auth_user_id, name, email")
        .in("auth_user_id", userIds);

      const { data: plans } = await supabase
        .from("plans")
        .select("id, plan_name")
        .in("id", planIds);

      const usersMap = new Map(users?.map((u) => [u.auth_user_id, u]));
      const plansMap = new Map(plans?.map((p) => [p.id, p]));

      setPayments(
        data.map((p) => ({
          ...p,
          user_name: usersMap.get(p.user_id)?.name ?? "Unknown",
          user_email: usersMap.get(p.user_id)?.email ?? "N/A",
          plan_name: plansMap.get(p.plan_id)?.plan_name ?? "Unknown Plan",
        })),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (
    paymentId: string,
    status: "verified" | "rejected",
  ) => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const adminId = auth.user?.id;

      const payment = payments.find((p) => p.id === paymentId);
      if (!payment) return;

      /* ---------------- REJECT ---------------- */
      if (status === "rejected") {
        const reason = prompt("Rejection reason:");
        await supabase
          .from("course_payments")
          .update({
            payment_status: "rejected",
            rejection_reason: reason ?? null,
            verified_at: new Date().toISOString(),
            verified_by: adminId,
          })
          .eq("id", paymentId);

        fetchPayments();
        return;
      }

      /* ---------------- VERIFY ---------------- */

      // 1. Resolve internal user
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", payment.user_id)
        .single();

      if (!userRow) throw new Error("User not found");

      // 2. Resolve sponsor (must own plan)
      let sponsorId: string | null = null;

      if (payment.referral_code) {
        const { data: sponsor } = await supabase
          .from("agents")
          .select("id")
          .eq("referral_code", payment.referral_code.toUpperCase())
          .maybeSingle();

        if (sponsor) {
          // Check if sponsor has ANY plan with same pairing_limit
          const { data: selectedPlanSettings } = await supabase
            .from("plan_chain_settings")
            .select("pairing_limit")
            .eq("plan_id", payment.plan_id)
            .single();

          const { data: sponsorPlans } = await supabase
            .from("agent_plans")
            .select("plan_id")
            .eq("agent_id", sponsor.id)
            .eq("is_active", true);

          if (!sponsorPlans || sponsorPlans.length === 0) {
            throw new Error("Sponsor has no active plans");
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
            throw new Error("Sponsor doesn't have a compatible plan");
          }

          sponsorId = sponsor.id;
        }
      }

      // 3. Create or fetch agent
      const { data: existingAgent } = await supabase
        .from("agents")
        .select("id, sponsor_id")
        .eq("user_id", userRow.id)
        .maybeSingle();

      let agentId: string;

      if (existingAgent) {
        agentId = existingAgent.id;
        sponsorId ??= existingAgent.sponsor_id;
      } else {
        const { data: newAgent, error } = await supabase
          .from("agents")
          .insert({
            user_id: userRow.id,
            sponsor_id: sponsorId,
            referral_code: Math.floor(
              10000000 + Math.random() * 90000000,
            ).toString(),
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        agentId = newAgent.id;
      }

      // 4. ✅ ASSIGN PLAN - USE UPSERT TO HANDLE DUPLICATES
      const { data: assignedPlan, error: planError } = await supabase
        .from("agent_plans")
        .upsert(
          {
            agent_id: agentId,
            plan_id: payment.plan_id,
            is_active: true,
            purchased_at: new Date().toISOString(),
          },
          {
            onConflict: "agent_id,plan_id",
            ignoreDuplicates: false, // Update if exists
          },
        )
        .select()
        .single();

      if (planError) {
        console.error("❌ Plan assignment error:", planError);
        throw new Error(`Failed to assign plan: ${planError.message}`);
      }

      console.log("✅ Plan assigned successfully:", assignedPlan.id);

      // Small delay to ensure trigger completes
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 5. Place in binary tree
      // ✅ VERIFY PLAN IS SAVED FIRST

      // 5. ✅ PLACE IN BINARY TREE
      const placement = await placeAgentInBinaryTree(
        agentId,
        payment.plan_id,
        sponsorId,
      );

      if (!placement.success) {
        console.error("❌ Placement error:", placement.error);
        // Don't delete the plan - just throw error so admin can retry
        throw new Error(placement.error);
      }

      console.log("✅ Agent placed in binary tree");
      //
      console.log("Calculating commissions for verified payment...");

      // Check if commissions already exist
      const { data: existingCommissions } = await supabase
        .from("commissions")
        .select("id")
        .eq("payment_id", paymentId)
        .limit(1);

      if (!existingCommissions || existingCommissions.length === 0) {
        const commissionResult = await calculateCommissions(
          paymentId,
          agentId,
          payment.plan_id,
          payment.payment_amount,
        );

        if (commissionResult.success) {
          console.log(`✅ ${commissionResult.message}`);
        } else {
          console.error(
            "⚠️ Commission calculation failed:",
            commissionResult.message,
          );
        }
      } else {
        console.log("ℹ️ Commissions already exist for this payment");
      }

      //
      // ✅ INSTANT CASHBACK (20%)
      const cashbackResult = await grantInstantCashback(
        payment.id, // payment_id
        agentId, // purchasing agent
        payment.plan_id, // plan_id
        payment.payment_amount, // ORIGINAL PAID AMOUNT
      );

      if (!cashbackResult.success) {
        console.error("Cashback error:", cashbackResult.message);
      }
      // 8. ✅ UPDATE LOCKED AMOUNT IN REWARD TABLE
      // Calculate locked amount based on plan's cashback percentage
      const { data: planData } = await supabase
        .from("plans")
        .select("cashback_percentage")
        .eq("id", payment.plan_id)
        .single();

      const cashbackPercentage = planData?.cashback_percentage || 20;
      const lockedPercentage = 100 - cashbackPercentage;
      const lockedAmount = (payment.payment_amount * lockedPercentage) / 100;

      const { data: planSettings } = await supabase
        .from("plan_chain_settings")
        .select("pairing_limit")
        .eq("plan_id", payment.plan_id)
        .single();

      const pairingLimit = planSettings?.pairing_limit ?? 1;

      const { error: rewardUpdateError } = await supabase
        .from("agent_plan_rewards")
        .update({
          locked_amount: lockedAmount,
          pairing_limit: pairingLimit,
        })
        .eq("agent_id", agentId)
        .eq("plan_id", payment.plan_id);

      if (rewardUpdateError) {
        console.error("⚠️ Reward update error:", rewardUpdateError);
      }

      // ✅ 6. FINAL: mark payment verified
      await supabase
        .from("course_payments")
        .update({
          payment_status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: adminId,
        })
        .eq("id", paymentId);

      fetchPayments();
    } catch (e: any) {
      alert(e.message ?? "Verification failed");
    }
  };

  /* ---------------- UI (UNCHANGED) ---------------- */

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-sm p-6 mb-4 border-l-4 border-[#03A9F4]">
          <h1 className="text-xl font-bold text-[#2B3674] uppercase tracking-wide">
            Payment Verifications
          </h1>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 text-red-700 text-xs border-l-4 border-red-500 font-bold">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-4 bg-white shadow-sm p-2">
          {["pending", "verified", "rejected", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 text-xs font-bold uppercase tracking-wide ${
                filter === s
                  ? "bg-[#03A9F4] text-white"
                  : "text-[#A3AED0] hover:bg-[#F4F7FE]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 border-[#03A9F4] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-[#A3AED0] mt-2 text-sm">Loading…</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-6 text-sm text-[#A3AED0] bg-white shadow-sm">
            No payments found
          </div>
        ) : (
          <table className="w-full text-xs bg-white shadow-sm">
            <thead>
              <tr className="border-b text-left bg-[#F4F7FE]">
                <th className="p-3 font-bold text-[#2B3674] uppercase">User</th>
                <th className="p-3 font-bold text-[#2B3674] uppercase">Plan</th>
                <th className="p-3 font-bold text-[#2B3674] uppercase text-right">
                  Amount
                </th>
                <th className="p-3 font-bold text-[#2B3674] uppercase">
                  Status
                </th>
                <th className="p-3 font-bold text-[#2B3674] uppercase">Date</th>
                <th className="p-3 font-bold text-[#2B3674] uppercase text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b hover:bg-[#F4F7FE]">
                  <td className="p-3">
                    <div className="font-bold text-[#2B3674]">
                      {p.user_name}
                    </div>
                    <div className="text-[10px] text-[#A3AED0]">
                      {p.user_email}
                    </div>
                  </td>
                  <td className="p-3 text-[#2B3674]">{p.plan_name}</td>
                  <td className="p-3 text-right font-bold text-[#2B3674]">
                    ₹{p.payment_amount}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs font-bold ${
                        p.payment_status === "verified"
                          ? "bg-green-100 text-green-700"
                          : p.payment_status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.payment_status}
                    </span>
                  </td>
                  <td className="p-3 text-[#A3AED0]">
                    {new Date(p.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center space-x-1">
                    <button
                      onClick={() => setSelectedImage(p.payment_screenshot_url)}
                      className="text-[#03A9F4] hover:text-[#25476A]"
                    >
                      <Eye size={14} />
                    </button>
                    {p.payment_status === "pending" && (
                      <>
                        <button
                          onClick={() => updatePaymentStatus(p.id, "verified")}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          onClick={() => updatePaymentStatus(p.id, "rejected")}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-4 shadow-lg max-w-3xl"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="float-right text-[#2B3674] hover:text-[#03A9F4]"
            >
              <X />
            </button>
            <img src={selectedImage} alt="Payment" className="mt-4" />
          </div>
        </div>
      )}
    </div>
  );
}
