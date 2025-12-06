"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, XCircle, Eye, X, DollarSign } from "lucide-react";

interface WithdrawalRequest {
  id: string;
  agent_id: string;
  amount: number;
  payment_method: string;
  payment_details: any;
  status: string;
  requested_at: string;
  rejection_reason?: string;
  agent_name?: string;
  agent_email?: string;
  agent_code?: string;
}

export default function WithdrawalApprovals() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<WithdrawalRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("withdrawal_requests")
        .select("*")
        .order("requested_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data: requestsData, error: fetchError } = await query;

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        setError(fetchError.message);
        throw fetchError;
      }

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Get agent details
      const agentIds = [...new Set(requestsData.map((r) => r.agent_id))];

      const { data: agentsData } = await supabase
        .from("agents")
        .select("id, user_id, referral_code")
        .in("id", agentIds);

      const userIds = agentsData?.map((a) => a.user_id) || [];

      const { data: usersData } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds);

      const agentsMap = new Map(agentsData?.map((a) => [a.id, a]) || []);
      const usersMap = new Map(usersData?.map((u) => [u.id, u]) || []);

      const enrichedRequests = requestsData.map((req) => {
        const agent = agentsMap.get(req.agent_id);
        const user = agent ? usersMap.get(agent.user_id) : null;

        return {
          ...req,
          agent_name: user?.name || "Unknown Agent",
          agent_email: user?.email || "N/A",
          agent_code: agent?.referral_code || "N/A",
        };
      });

      setRequests(enrichedRequests);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      setError(error.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: string,
    rejectionReason?: string
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const updateData: any = {
        status: status,
      };

      if (status === "approved") {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id || null;
      } else if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else if (status === "rejected") {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from("withdrawal_requests")
        .update(updateData)
        .eq("id", requestId);

      if (error) throw error;

      alert(`Withdrawal ${status} successfully!`);
      fetchRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Failed to update request status");
    }
  };

  const handleApprove = (requestId: string) => {
    if (confirm("Approve this withdrawal request?")) {
      updateRequestStatus(requestId, "approved");
    }
  };

  const handleComplete = (requestId: string) => {
    if (
      confirm(
        "Mark this withdrawal as completed? This means payment has been sent."
      )
    ) {
      updateRequestStatus(requestId, "completed");
    }
  };

  const handleReject = (requestId: string) => {
    const reason = prompt("Rejection reason:");
    if (reason) {
      updateRequestStatus(requestId, "rejected", reason);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          Withdrawal Requests
        </h1>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-4 border-b">
          {["pending", "approved", "completed", "rejected", "all"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
                  filter === status
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-900 mx-auto"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            No requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b">
                <tr className="text-left text-gray-600">
                  <th className="pb-2 font-medium">Agent</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium">Payment Method</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {req.agent_name}
                        </div>
                        <div className="text-gray-500 text-[10px]">
                          {req.agent_email}
                        </div>
                        <div className="text-gray-500 text-[10px]">
                          Code: {req.agent_code}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium">
                      ₹{Number(req.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 text-gray-700">
                      {req.payment_method.replace("_", " ").toUpperCase()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                          req.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : req.status === "approved"
                            ? "bg-blue-100 text-blue-700"
                            : req.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(req.requested_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                        </button>

                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </>
                        )}

                        {req.status === "approved" && (
                          <button
                            onClick={() => handleComplete(req.id)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Mark as Completed"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-green-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowDetailsModal(false);
            setSelectedRequest(null);
          }}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <span className="text-sm font-medium text-gray-900">
                Withdrawal Request Details
              </span>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRequest(null);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Agent</p>
                <p className="font-medium text-gray-900">
                  {selectedRequest.agent_name}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedRequest.agent_email}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="font-bold text-lg text-gray-900">
                  ₹{Number(selectedRequest.amount).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Payment Method</p>
                <p className="font-medium text-gray-900">
                  {selectedRequest.payment_method
                    .replace("_", " ")
                    .toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Payment Details</p>
                <div className="bg-gray-50 p-3 rounded text-xs">
                  <pre>
                    {JSON.stringify(selectedRequest.payment_details, null, 2)}
                  </pre>
                </div>
              </div>
              {selectedRequest.rejection_reason && (
                <div>
                  <p className="text-gray-600">Rejection Reason</p>
                  <p className="text-red-600">
                    {selectedRequest.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
