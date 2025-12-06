"use client";
import { useState, useEffect } from "react";
import { NextPage } from "next";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

// Icons
const RefreshIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const EditIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  mobile_number: string;
}

interface LoanApplication {
  id: string;
  user_id: string;
  loan_type: string;
  loan_amount: number;
  amount_received?: number;
  tenure: number;
  tenure_unit: string;
  disbursement_interest: number;
  repayment_interest: number;
  payment_type: "weekly" | "monthly";
  installment_amount: number;
  last_installment_amount?: number;
  total_payable: number;
  total_interest: number;
  status: string;
  disbursed_at: string;
  users?: User;
}

interface PendingPayment {
  id: string;
  emi_id: string;
  emi_number: number;
  user_name: string;
  emi_amount: number;
  payment_screenshot_url: string;
  payment_verification_status: string;
  payment_submitted_at: string;
  loan_type: string;
}

interface LoanEMI {
  id: string;
  loan_application_id: string;
  emi_number: number;
  due_date: string;
  emi_amount: number;
  status: "pending" | "paid" | "overdue" | "partial";
  paid_amount: number;
  paid_date?: string;
  payment_notes?: string;
  payment_screenshot_url?: string;
  payment_verification_status?: string;
  payment_submitted_at?: string;
  created_at: string;
  updated_at: string;
}

// Services
const emiService = {
  getDisbursedLoans: async () => {
    try {
      const { data: applications, error: appError } = await supabase
        .from("loan_applications")
        .select("*")
        .in("status", ["disbursed", "completed"])
        .order("disbursed_at", { ascending: false });

      if (appError) throw appError;

      if (!applications || applications.length === 0) {
        return { success: true, loans: [] };
      }

      const userIds = [
        ...new Set(applications.map((app) => app.user_id).filter(Boolean)),
      ];

      if (userIds.length === 0) {
        return {
          success: true,
          loans: applications.map((app) => ({ ...app, users: null })),
        };
      }

      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, name, email, mobile_number, auth_user_id")
        .in("auth_user_id", userIds);

      if (userError) {
        console.error("Error fetching users:", userError);
        return {
          success: true,
          loans: applications.map((app) => ({ ...app, users: null })),
        };
      }

      const usersMap = new Map(users?.map((u) => [u.auth_user_id, u]) || []);

      const result = applications.map((app) => ({
        ...app,
        users: usersMap.get(app.user_id) || null,
      }));

      return { success: true, loans: result };
    } catch (error) {
      console.error("Get disbursed loans error:", error);
      return {
        success: false,
        error: (error as Error).message,
        loans: [],
      };
    }
  },

  getEMIsForLoan: async (loanId: string) => {
    try {
      const { data, error } = await supabase
        .from("loan_emis")
        .select("*")
        .eq("loan_application_id", loanId)
        .order("emi_number", { ascending: true });

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updatedEmis =
        data?.map((emi) => {
          const dueDate = new Date(emi.due_date);
          dueDate.setHours(0, 0, 0, 0);

          if (emi.status === "pending" && dueDate < today) {
            return { ...emi, status: "overdue" as const };
          }
          return emi;
        }) || [];

      return { success: true, emis: updatedEmis };
    } catch (error) {
      console.error("Get EMIs error:", error);
      return { success: false, error: (error as Error).message, emis: [] };
    }
  },

  updateEMIPayment: async (
    emiId: string,
    paidAmount: number,
    paymentNotes: string,
    emiAmount: number
  ) => {
    try {
      const status = paidAmount >= emiAmount ? "paid" : "partial";

      const { data, error } = await supabase
        .from("loan_emis")
        .update({
          status: status,
          paid_amount: paidAmount,
          paid_date: new Date().toISOString(),
          payment_notes: paymentNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", emiId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, emi: data };
    } catch (error) {
      console.error("Update EMI error:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // FIXED getPendingPaymentVerifications FUNCTION
  // Replace your current function (around line 250-270) with this:

  getPendingPaymentVerifications: async () => {
    try {
      // First, get pending EMIs with screenshots
      const { data: emis, error: emiError } = await supabase
        .from("loan_emis")
        .select("*")
        .eq("payment_verification_status", "pending")
        .not("payment_screenshot_url", "is", null)
        .order("payment_submitted_at", { ascending: false });

      if (emiError) throw emiError;

      if (!emis || emis.length === 0) {
        return { success: true, payments: [] };
      }

      // Get loan application IDs
      const loanAppIds = [...new Set(emis.map((e) => e.loan_application_id))];

      // Get loan applications
      const { data: loanApps, error: loanError } = await supabase
        .from("loan_applications")
        .select("id, loan_type, user_id")
        .in("id", loanAppIds);

      if (loanError) throw loanError;

      // Get user IDs
      const userIds = [
        ...new Set(loanApps?.map((l) => l.user_id).filter(Boolean) || []),
      ];

      // Get users
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("auth_user_id, name")
        .in("auth_user_id", userIds);

      if (userError) throw userError;

      // Map everything together
      const loanMap = new Map(loanApps?.map((l) => [l.id, l]));
      const userMap = new Map(users?.map((u) => [u.auth_user_id, u]));

      const formatted = emis.map((emi: any) => {
        const loan = loanMap.get(emi.loan_application_id);
        const user = loan ? userMap.get(loan.user_id) : null;

        return {
          id: emi.id,
          emi_id: emi.id,
          emi_number: emi.emi_number,
          user_name: user?.name || "Unknown",
          emi_amount: emi.emi_amount,
          payment_screenshot_url: emi.payment_screenshot_url,
          payment_verification_status: emi.payment_verification_status,
          payment_submitted_at: emi.payment_submitted_at,
          loan_type: loan?.loan_type || "Unknown",
        };
      });

      return { success: true, payments: formatted };
    } catch (error) {
      console.error("Get pending payments error:", error);
      return { success: false, error: (error as Error).message, payments: [] };
    }
  },

  // CHANGES MADE:
  // 1. Changed from nested select to separate queries
  // 2. Added check for null payment_screenshot_url
  // 3. Proper error handling at each step
  // 4. Uses Maps for efficient data joining
  // 5. Filters out null user_ids before querying users table

  verifyPayment: async (
    emiId: string,
    verified: boolean,
    paymentNotes: string
  ) => {
    try {
      const { error } = await supabase
        .from("loan_emis")
        .update({
          payment_verification_status: verified ? "verified" : "rejected",
          status: verified ? "paid" : "pending",
          paid_amount: verified
            ? (
                await supabase
                  .from("loan_emis")
                  .select("emi_amount")
                  .eq("id", emiId)
                  .single()
              ).data?.emi_amount
            : 0,
          paid_date: verified ? new Date().toISOString() : null,
          payment_notes: paymentNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", emiId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Verify payment error:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  checkAndCompleteLoan: async (loanId: string) => {
    try {
      const { data: emis, error: emiError } = await supabase
        .from("loan_emis")
        .select("status")
        .eq("loan_application_id", loanId);

      if (emiError) throw emiError;

      const allPaid = emis?.every((emi) => emi.status === "paid");

      if (allPaid) {
        const { error: updateError } = await supabase
          .from("loan_applications")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          .eq("id", loanId);

        if (updateError) throw updateError;
        return { success: true, completed: true };
      }

      return { success: true, completed: false };
    } catch (error) {
      console.error("Check loan completion error:", error);
      return {
        success: false,
        error: (error as Error).message,
        completed: false,
      };
    }
  },
};

const EMIManagement: NextPage = () => {
  const router = useRouter();
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(
    null
  );
  const [emis, setEmis] = useState<LoanEMI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEMIs, setIsLoadingEMIs] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEMI, setSelectedEMI] = useState<LoanEMI | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [selectedPaymentReview, setSelectedPaymentReview] =
    useState<PendingPayment | null>(null);
  const [showPaymentReviewModal, setShowPaymentReviewModal] = useState(false);

  useEffect(() => {
    loadLoans();
    loadPendingPayments();
  }, []);
  //
  useEffect(() => {
    const channel = supabase
      .channel("admin-loan-emis-all")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "loan_emis",
        },
        (payload) => {
          console.log("EMI changed:", payload);

          // Reload pending payments (in case new payment submitted)
          loadPendingPayments();

          // If a loan is selected, reload its EMIs
          if (selectedLoan) {
            loadEMIs(selectedLoan.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLoan]); // Re-subscribe when selected loan changes

  // 2. Listen to loan_applications changes (for loan status updates)
  useEffect(() => {
    const channel = supabase
      .channel("admin-loan-applications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "loan_applications",
        },
        (payload) => {
          console.log("Loan application updated:", payload);

          // Reload loans list
          loadLoans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Listen to specific loan's EMIs when a loan is selected
  useEffect(() => {
    if (!selectedLoan) return;

    const channel = supabase
      .channel(`admin-loan-emis-${selectedLoan.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loan_emis",
          filter: `loan_application_id=eq.${selectedLoan.id}`,
        },
        (payload) => {
          console.log("Selected loan EMI updated:", payload);

          // Reload EMIs for selected loan
          loadEMIs(selectedLoan.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLoan]);

  //
  const loadLoans = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await emiService.getDisbursedLoans();

      if (result.success) {
        setLoans(result.loans);
      } else {
        setError(result.error || "Failed to load loans");
      }
    } catch (err) {
      console.error("Load loans error:", err);
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEMIs = async (loanId: string) => {
    setIsLoadingEMIs(true);
    try {
      const result = await emiService.getEMIsForLoan(loanId);

      if (result.success) {
        setEmis(result.emis);
      } else {
        setError(result.error || "Failed to load EMIs");
      }
    } catch (err) {
      console.error("Load EMIs error:", err);
      setError("Something went wrong");
    } finally {
      setIsLoadingEMIs(false);
    }
  };

  const handleSelectLoan = async (loan: LoanApplication) => {
    setSelectedLoan(loan);
    await loadEMIs(loan.id);
  };

  const handleMarkPayment = (emi: LoanEMI) => {
    setSelectedEMI(emi);
    const currentlyPaid = emi.paid_amount || 0;
    const remaining = Math.max(0, emi.emi_amount - currentlyPaid);
    setPaymentAmount(remaining.toFixed(2));
    setPaymentNotes("");
    setShowPaymentModal(true);
  };

  const loadPendingPayments = async () => {
    try {
      const result = await emiService.getPendingPaymentVerifications();
      if (result.success) {
        setPendingPayments(result.payments);
      }
    } catch (err) {
      console.error("Load pending payments error:", err);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedEMI || !paymentAmount) return;

    try {
      const currentPaid = selectedEMI.paid_amount || 0;
      const newPayment = parseFloat(paymentAmount);
      const totalPaid = Number((currentPaid + newPayment).toFixed(2));

      const result = await emiService.updateEMIPayment(
        selectedEMI.id,
        totalPaid,
        paymentNotes,
        selectedEMI.emi_amount
      );

      if (result.success) {
        await loadEMIs(selectedLoan!.id);

        const completionResult = await emiService.checkAndCompleteLoan(
          selectedLoan!.id
        );

        if (completionResult.completed) {
          alert("🎉 All EMIs paid! Loan marked as completed.");
          await loadLoans();
          setSelectedLoan(null);
          setEmis([]);
        }

        setShowPaymentModal(false);
        setSelectedEMI(null);
        setPaymentAmount("");
        setPaymentNotes("");
      } else {
        setError(result.error || "Failed to update payment");
      }
    } catch (err) {
      console.error("Submit payment error:", err);
      setError("Something went wrong");
    }
  };

  const handleReviewPayment = (payment: PendingPayment) => {
    setSelectedPaymentReview(payment);
    setShowPaymentReviewModal(true);
  };

  const handleVerifyPayment = async (verified: boolean) => {
    if (!selectedPaymentReview) return;

    try {
      const result = await emiService.verifyPayment(
        selectedPaymentReview.emi_id,
        verified,
        verified ? "Payment verified by admin" : "Payment rejected by admin"
      );

      if (result.success) {
        alert(verified ? "✅ Payment Approved!" : "❌ Payment Rejected");
        setShowPaymentReviewModal(false);
        setSelectedPaymentReview(null);
        await loadPendingPayments();
        if (selectedLoan) {
          await loadEMIs(selectedLoan.id);
        }
      }
    } catch (err) {
      console.error("Verify payment error:", err);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadLoans();
    await loadPendingPayments();
    if (selectedLoan) {
      await loadEMIs(selectedLoan.id);
    }
    setRefreshing(false);
  };

  const filteredLoans = loans.filter((loan) => {
    const user = loan.users;
    return (
      loan.loan_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.mobile_number?.includes(searchTerm)
    );
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "partial":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "overdue":
        return <XCircle className="w-4 h-4" />;
      case "partial":
        return <DollarSign className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateProgress = (emis: LoanEMI[], loanTotalPayable: number) => {
    const totalEMIs = emis.length;
    const paidEMIs = emis.filter((e) => e.status === "paid").length;
    const paidAmount = emis.reduce((sum, e) => sum + (e.paid_amount || 0), 0);
    const totalAmount = loanTotalPayable;

    return {
      paidEMIs,
      totalEMIs,
      paidAmount,
      totalAmount,
      percentage: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Minimal with matching theme */}
      <header className="bg-white shadow-sm">
        <div className="relative">
          <div className="absolute inset-0 opacity-10">
            <div
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
              className="w-full h-full"
            />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-base font-bold text-black">
                    EMI Management
                  </h1>
                  <p className="text-xs text-gray-700">
                    Track and manage loan payments
                  </p>
                </div>
              </div>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-black hover:bg-black/10 rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                <div className={refreshing ? "animate-spin" : ""}>
                  <RefreshIcon />
                </div>
                <span className="hidden sm:inline">
                  {refreshing ? "..." : "Refresh"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700 text-xs mt-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Loans List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-3 border-b">
                <h2 className="font-semibold text-gray-900 mb-2 text-sm">
                  Loan Records
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search loans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <SearchIcon />
                  </div>
                </div>
              </div>

              <div className="divide-y max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                ) : filteredLoans.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-sm">
                      No active loans found
                    </p>
                  </div>
                ) : (
                  filteredLoans.map((loan) => (
                    <button
                      key={loan.id}
                      onClick={() => handleSelectLoan(loan)}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                        selectedLoan?.id === loan.id
                          ? "bg-yellow-50 border-l-4 border-yellow-400"
                          : ""
                      }`}
                    >
                      <p className="font-medium text-gray-900 text-sm">
                        {loan.users?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-600">{loan.loan_type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        ₹{loan.loan_amount.toLocaleString("en-IN")} •{" "}
                        {loan.tenure}{" "}
                        {loan.payment_type === "weekly" ? "weeks" : "months"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Disbursed: {formatDate(loan.disbursed_at)}
                      </p>
                      {loan.status === "completed" && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-300">
                          ✓ Completed
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: EMI Details */}
          <div className="lg:col-span-2">
            {!selectedLoan ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Select a loan to view EMI schedule
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm">
                {/* Loan Header */}
                <div className="p-4 border-b bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {selectedLoan.users?.name}
                      </h2>
                      <p className="text-xs text-gray-600">
                        {selectedLoan.loan_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Total Repay</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{selectedLoan.total_payable.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Interest Info */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-gray-500">Loan Amount</p>
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{selectedLoan.loan_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-red-600">Disbursement</p>
                      <p className="text-sm font-semibold text-red-600">
                        -{selectedLoan.disbursement_interest}%
                      </p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-orange-600">Repayment</p>
                      <p className="text-sm font-semibold text-orange-600">
                        +{selectedLoan.repayment_interest}%
                      </p>
                    </div>
                  </div>

                  {selectedLoan.amount_received && (
                    <div className="bg-white rounded p-2 mb-3">
                      <p className="text-xs text-gray-500">
                        Amount Received by User
                      </p>
                      <p className="text-base font-bold text-green-600">
                        ₹{selectedLoan.amount_received.toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}

                  {/* Progress */}
                  {emis.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-600">Payment Progress</span>
                        <span className="font-semibold text-gray-900">
                          {
                            calculateProgress(emis, selectedLoan.total_payable)
                              .paidEMIs
                          }{" "}
                          /{" "}
                          {
                            calculateProgress(emis, selectedLoan.total_payable)
                              .totalEMIs
                          }{" "}
                          EMIs
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              calculateProgress(
                                emis,
                                selectedLoan.total_payable
                              ).percentage
                            }%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-600 font-semibold">
                          ₹
                          {calculateProgress(
                            emis,
                            selectedLoan.total_payable
                          ).paidAmount.toLocaleString("en-IN")}{" "}
                          paid
                        </span>
                        <span className="text-gray-600">
                          ₹
                          {(
                            calculateProgress(emis, selectedLoan.total_payable)
                              .totalAmount -
                            calculateProgress(emis, selectedLoan.total_payable)
                              .paidAmount
                          ).toLocaleString("en-IN")}{" "}
                          remaining
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* EMI List */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                    EMI Schedule
                  </h3>

                  {isLoadingEMIs ? (
                    <div className="py-12 text-center">
                      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading EMIs...</p>
                    </div>
                  ) : emis.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-gray-500 text-sm">No EMIs found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {emis.map((emi, index) => {
                        const isLastEMI = index === emis.length - 1;
                        const lastEMIAmount =
                          selectedLoan.last_installment_amount;
                        const showLastEMINote =
                          isLastEMI &&
                          lastEMIAmount &&
                          lastEMIAmount !== selectedLoan.installment_amount;

                        return (
                          <div
                            key={emi.id}
                            className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-center">
                                  <p className="text-xs text-gray-500">EMI</p>
                                  <p className="text-base font-bold text-gray-900">
                                    {emi.emi_number}
                                  </p>
                                  {showLastEMINote && (
                                    <p className="text-xs text-yellow-600 mt-0.5">
                                      Last
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    <p className="text-xs font-medium text-gray-900">
                                      Due: {formatDate(emi.due_date)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-600">
                                      ₹{emi.emi_amount.toLocaleString("en-IN")}
                                    </p>
                                  </div>
                                  {(emi.paid_amount || 0) > 0 && (
                                    <p className="text-xs text-green-600 mt-1">
                                      Paid: ₹
                                      {(emi.paid_amount || 0).toLocaleString(
                                        "en-IN"
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                    emi.status
                                  )}`}
                                >
                                  {getStatusIcon(emi.status)}
                                  {emi.status.charAt(0).toUpperCase() +
                                    emi.status.slice(1)}
                                </span>

                                {/* ADD THIS: Check if this EMI has pending payment verification */}
                                {(() => {
                                  const pendingPayment = pendingPayments.find(
                                    (p) => p.emi_id === emi.id
                                  );

                                  if (pendingPayment) {
                                    return (
                                      <button
                                        onClick={() =>
                                          handleReviewPayment(pendingPayment)
                                        }
                                        className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg font-medium"
                                      >
                                        📸 Review
                                      </button>
                                    );
                                  }

                                  return null;
                                })()}

                                {emi.status !== "paid" &&
                                  !pendingPayments.find(
                                    (p) => p.emi_id === emi.id
                                  ) && (
                                    <button
                                      onClick={() => handleMarkPayment(emi)}
                                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                      title="Mark Payment"
                                    >
                                      <EditIcon />
                                    </button>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedEMI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Record Payment
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  EMI #{selectedEMI.emi_number}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  Due: {formatDate(selectedEMI.due_date)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">EMI Amount</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{selectedEMI.emi_amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Already Paid</span>
                <span className="text-sm font-semibold text-green-600">
                  ₹{(selectedEMI.paid_amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  Remaining
                </span>
                <span className="text-lg font-bold text-red-600">
                  ₹
                  {Math.max(
                    0,
                    selectedEMI.emi_amount - (selectedEMI.paid_amount || 0)
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                  placeholder="Enter amount"
                  step="0.01"
                  max={selectedEMI.emi_amount - (selectedEMI.paid_amount || 0)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Notes
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400"
                  rows={3}
                  placeholder="Cash, bank transfer, reference number, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedEMI(null);
                  setPaymentAmount("");
                  setPaymentNotes("");
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Review Modal */}
      {showPaymentReviewModal && selectedPaymentReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Review Payment - EMI #{selectedPaymentReview.emi_number}
            </h3>

            {/* User Info */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">User</p>
                  <p className="font-semibold text-gray-900">
                    {selectedPaymentReview.user_name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Loan Type</p>
                  <p className="font-semibold text-gray-900">
                    {selectedPaymentReview.loan_type}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Amount</p>
                  <p className="font-semibold text-gray-900">
                    ₹{selectedPaymentReview.emi_amount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Submitted</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(selectedPaymentReview.payment_submitted_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Screenshot */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Payment Screenshot:
              </p>
              <div className="border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
                <img
                  src={selectedPaymentReview.payment_screenshot_url}
                  alt="Payment Screenshot"
                  className="w-full h-auto rounded"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPaymentReviewModal(false);
                  setSelectedPaymentReview(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyPayment(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                ❌ Reject
              </button>
              <button
                onClick={() => handleVerifyPayment(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ✅ Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EMIManagement;
