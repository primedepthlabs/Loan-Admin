"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  AlertCircle,
} from "lucide-react";

interface WithdrawalRequest {
  id: string;
  agent_id: string;
  amount: number;
  status: "pending" | "approved" | "completed" | "rejected";
  payment_method: string | null;
  payment_details: any;
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
  completed_at: string | null;
  rejection_reason: string | null;
  transaction_id: string | null;
  agent?: {
    referral_code: string;
    user?: {
      name: string;
      email: string;
      mobile_number: string;
    };
  };
}

interface Stats {
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
  totalPending: number;
  totalApproved: number;
}

export default function AdminWithdrawalDashboard() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<
    WithdrawalRequest[]
  >([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    totalPending: 0,
    totalApproved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequest | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    loadWithdrawals();

    const channel = supabase
      .channel("withdrawal_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawal_requests",
        },
        () => {
          loadWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterWithdrawals();
  }, [withdrawals, filterStatus, searchQuery]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select(
          `
          *,
          agent:agents!withdrawal_requests_agent_id_fkey(
            referral_code,
            user:users!agents_user_id_fkey(
              name,
              email,
              mobile_number
            )
          )
        `
        )
        .order("requested_at", { ascending: false });

      if (error) throw error;

      setWithdrawals(data || []);

      const pending = data?.filter((w) => w.status === "pending").length || 0;
      const approved = data?.filter((w) => w.status === "approved").length || 0;
      const completed =
        data?.filter((w) => w.status === "completed").length || 0;
      const rejected = data?.filter((w) => w.status === "rejected").length || 0;

      const totalPending =
        data
          ?.filter((w) => w.status === "pending")
          .reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      const totalApproved =
        data
          ?.filter((w) => w.status === "approved")
          .reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      setStats({
        pending,
        approved,
        completed,
        rejected,
        totalPending,
        totalApproved,
      });
    } catch (error) {
      console.error("Error loading withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterWithdrawals = () => {
    let filtered = [...withdrawals];

    if (filterStatus !== "all") {
      filtered = filtered.filter((w) => w.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.agent?.user?.name?.toLowerCase().includes(query) ||
          w.agent?.user?.email?.toLowerCase().includes(query) ||
          w.agent?.referral_code?.toLowerCase().includes(query) ||
          w.id.toLowerCase().includes(query)
      );
    }

    setFilteredWithdrawals(filtered);
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this withdrawal request?")) return;

    try {
      setProcessingId(id);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      alert("Withdrawal approved successfully!");
      setSelectedWithdrawal(null);
      loadWithdrawals();
    } catch (error: any) {
      console.error("Error approving withdrawal:", error);
      alert("Failed to approve: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (id: string) => {
    if (!transactionId.trim()) {
      alert("Please enter transaction ID");
      return;
    }

    if (!confirm("Mark this withdrawal as completed?")) return;

    try {
      setProcessingId(id);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "completed",
          transaction_id: transactionId,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      alert("Withdrawal completed successfully!");
      setSelectedWithdrawal(null);
      setTransactionId("");
      loadWithdrawals();
    } catch (error: any) {
      console.error("Error completing withdrawal:", error);
      alert("Failed to complete: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!reason.trim()) {
      alert("Please enter rejection reason");
      return;
    }

    if (!confirm("Reject this withdrawal request?")) return;

    try {
      setProcessingId(id);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          rejection_reason: reason,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      alert("Withdrawal rejected!");
      setSelectedWithdrawal(null);
      loadWithdrawals();
    } catch (error: any) {
      console.error("Error rejecting withdrawal:", error);
      alert("Failed to reject: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return badges[status as keyof typeof badges] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-[#03A9F4] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE]">
      {/* Header */}
      <div className="bg-white shadow-sm border-l-4 border-[#03A9F4]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-[#2B3674] uppercase tracking-wide">
            Withdrawal Management
          </h1>
          <p className="text-sm text-[#A3AED0] mt-1 font-medium">
            Process agent withdrawal requests
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow-sm p-4 border-l-4 border-yellow-500">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <p className="text-xs text-[#A3AED0] font-bold uppercase">Pending</p>
            </div>
            <p className="text-2xl font-bold text-[#2B3674]">{stats.pending}</p>
            <p className="text-sm text-[#A3AED0]">
              ₹{stats.totalPending.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="bg-white shadow-sm p-4 border-l-4 border-[#03A9F4]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-[#03A9F4]" />
              <p className="text-xs text-[#A3AED0] font-bold uppercase">Approved</p>
            </div>
            <p className="text-2xl font-bold text-[#2B3674]">{stats.approved}</p>
            <p className="text-sm text-[#A3AED0]">
              ₹{stats.totalApproved.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="bg-white shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-xs text-[#A3AED0] font-bold uppercase">Completed</p>
            </div>
            <p className="text-2xl font-bold text-[#2B3674]">
              {stats.completed}
            </p>
          </div>

          <div className="bg-white shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-xs text-[#A3AED0] font-bold uppercase">Rejected</p>
            </div>
            <p className="text-2xl font-bold text-[#2B3674]">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm p-4 mb-6 border-l-4 border-[#03A9F4]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A3AED0]" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] text-[#2B3674]"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "pending", "approved", "completed", "rejected"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                      filterStatus === status
                        ? "bg-[#03A9F4] text-white"
                        : "bg-[#F4F7FE] text-[#2B3674] hover:bg-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F4F7FE] border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#2B3674] uppercase">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#2B3674] uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#2B3674] uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#2B3674] uppercase">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#2B3674] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-[#F4F7FE]">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-[#2B3674]">
                          {withdrawal.agent?.user?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-[#A3AED0]">
                          {withdrawal.agent?.referral_code}
                        </p>
                        <p className="text-xs text-[#A3AED0]">
                          {withdrawal.agent?.user?.mobile_number}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#2B3674]">
                      ₹{Number(withdrawal.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-bold ${getStatusBadge(
                          withdrawal.status
                        )}`}
                      >
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#A3AED0]">
                      {new Date(withdrawal.requested_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedWithdrawal(withdrawal)}
                        className="text-[#03A9F4] hover:text-[#25476A] font-bold text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredWithdrawals.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No withdrawal requests found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedWithdrawal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setSelectedWithdrawal(null);
            setTransactionId("");
          }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Withdrawal Details
                </h3>
                <p className="text-sm text-gray-500 mt-1 font-mono">
                  {selectedWithdrawal.id}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedWithdrawal(null);
                  setTransactionId("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Agent Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Agent Information
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Name:</span>{" "}
                    <span className="font-medium">
                      {selectedWithdrawal.agent?.user?.name}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Email:</span>{" "}
                    {selectedWithdrawal.agent?.user?.email}
                  </p>
                  <p>
                    <span className="text-gray-600">Phone:</span>{" "}
                    {selectedWithdrawal.agent?.user?.mobile_number}
                  </p>
                  <p>
                    <span className="text-gray-600">Referral Code:</span>{" "}
                    <span className="font-mono bg-white px-2 py-1 rounded">
                      {selectedWithdrawal.agent?.referral_code}
                    </span>
                  </p>
                </div>
              </div>

              {/* Withdrawal Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Withdrawal Details
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Amount:</span>{" "}
                    <span className="text-2xl font-bold text-gray-900">
                      ₹
                      {Number(selectedWithdrawal.amount).toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Requested:</span>{" "}
                    {new Date(selectedWithdrawal.requested_at).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                  <p>
                    <span className="text-gray-600">Status:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        selectedWithdrawal.status
                      )}`}
                    >
                      {selectedWithdrawal.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Status Actions */}
              {selectedWithdrawal.status === "pending" && (
                <div className="space-y-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedWithdrawal.id)}
                    disabled={processingId === selectedWithdrawal.id}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Withdrawal
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Enter rejection reason:");
                      if (reason) {
                        handleReject(selectedWithdrawal.id, reason);
                      }
                    }}
                    disabled={processingId === selectedWithdrawal.id}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Withdrawal
                  </button>
                </div>
              )}

              {selectedWithdrawal.status === "approved" && (
                <div className="pt-4 border-t space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID / Reference Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter transaction ID"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => handleComplete(selectedWithdrawal.id)}
                    disabled={
                      processingId === selectedWithdrawal.id ||
                      !transactionId.trim()
                    }
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Mark as Completed
                  </button>
                </div>
              )}

              {selectedWithdrawal.status === "completed" && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">
                    ✓ Payment Completed
                  </h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <p>
                      <span className="font-medium">Transaction ID:</span>{" "}
                      <span className="font-mono">
                        {selectedWithdrawal.transaction_id}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Completed On:</span>{" "}
                      {selectedWithdrawal.completed_at &&
                        new Date(
                          selectedWithdrawal.completed_at
                        ).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}

              {selectedWithdrawal.status === "rejected" && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">
                    ✗ Withdrawal Rejected
                  </h4>
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Reason:</span>{" "}
                    {selectedWithdrawal.rejection_reason}
                  </p>
                  {selectedWithdrawal.approved_at && (
                    <p className="text-xs text-red-600 mt-2">
                      Rejected on:{" "}
                      {new Date(selectedWithdrawal.approved_at).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
