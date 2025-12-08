"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, XCircle, Eye, X } from "lucide-react";
import { placeAgentInBinaryTree } from "@/lib/binaryPlacement";
import { calculateCommissions } from "@/lib/commissionCalculation";
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
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (
    paymentId: string,
    status: "verified" | "rejected"
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
          const { data: sponsorPlan } = await supabase
            .from("agent_plans")
            .select("id")
            .eq("agent_id", sponsor.id)
            .eq("plan_id", payment.plan_id)
            .eq("is_active", true)
            .maybeSingle();

          if (!sponsorPlan) throw new Error("Sponsor does not own this plan");

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
              10000000 + Math.random() * 90000000
            ).toString(),
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        agentId = newAgent.id;
      }
      await supabase
        .from("users")
        .update({ is_agent: true })
        .eq("id", userRow.id);
      // 4. Assign plan
      const { data: existingPlan } = await supabase
        .from("agent_plans")
        .select("id, is_active")
        .eq("agent_id", agentId)
        .eq("plan_id", payment.plan_id)
        .maybeSingle();

      if (!existingPlan) {
        await supabase.from("agent_plans").insert({
          agent_id: agentId,
          plan_id: payment.plan_id,
          is_active: true,
        });
      } else if (!existingPlan.is_active) {
        await supabase
          .from("agent_plans")
          .update({ is_active: true })
          .eq("id", existingPlan.id);
      }

      // 5. Place in binary tree
      const placement = await placeAgentInBinaryTree(
        agentId,
        payment.plan_id,
        sponsorId
      );

      if (!placement.success) {
        await supabase
          .from("agent_plans")
          .delete()
          .eq("agent_id", agentId)
          .eq("plan_id", payment.plan_id);
        throw new Error(placement.error);
      }
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
          payment.payment_amount
        );

        if (commissionResult.success) {
          console.log(`✅ ${commissionResult.message}`);
        } else {
          console.error(
            "⚠️ Commission calculation failed:",
            commissionResult.message
          );
        }
      } else {
        console.log("ℹ️ Commissions already exist for this payment");
      }

      //
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
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">Payment Verifications</h1>

        {error && (
          <div className="mb-3 p-3 bg-red-50 text-red-700 text-xs">{error}</div>
        )}

        <div className="flex gap-2 mb-4 border-b">
          {["pending", "verified", "rejected", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 text-xs border-b-2 ${
                filter === s
                  ? "border-black font-semibold"
                  : "border-transparent text-gray-500"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-6">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">
            No payments found
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left">
                <th>User</th>
                <th>Plan</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b">
                  <td>
                    <div>{p.user_name}</div>
                    <div className="text-[10px] text-gray-500">
                      {p.user_email}
                    </div>
                  </td>
                  <td>{p.plan_name}</td>
                  <td className="text-right">₹{p.payment_amount}</td>
                  <td>{p.payment_status}</td>
                  <td>{new Date(p.submitted_at).toLocaleDateString()}</td>
                  <td className="text-center space-x-1">
                    <button
                      onClick={() => setSelectedImage(p.payment_screenshot_url)}
                    >
                      <Eye size={14} />
                    </button>
                    {p.payment_status === "pending" && (
                      <>
                        <button
                          onClick={() => updatePaymentStatus(p.id, "verified")}
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          onClick={() => updatePaymentStatus(p.id, "rejected")}
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
            className="bg-white p-4 rounded max-w-3xl"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="float-right"
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
