"use client";
import { useState, useEffect } from "react";
import { NextPage } from "next";
import { supabase } from "@/lib/supabaseClient";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Edit3,
  DollarSign,
  AlertCircle,
  X,
  Loader2,
  CreditCard,
  Check,
  Image,
} from "lucide-react";

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
      return { success: false, error: (error as Error).message, emis: [] };
    }
  },

  updateEMIPayment: async (
    emiId: string,
    paidAmount: number,
    paymentNotes: string,
    emiAmount: number,
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
      return { success: false, error: (error as Error).message };
    }
  },

  getPendingPaymentVerifications: async () => {
    try {
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

      const loanAppIds = [...new Set(emis.map((e) => e.loan_application_id))];

      const { data: loanApps, error: loanError } = await supabase
        .from("loan_applications")
        .select("id, loan_type, user_id")
        .in("id", loanAppIds);

      if (loanError) throw loanError;

      const userIds = [
        ...new Set(loanApps?.map((l) => l.user_id).filter(Boolean) || []),
      ];

      const { data: users, error: userError } = await supabase
        .from("users")
        .select("auth_user_id, name")
        .in("auth_user_id", userIds);

      if (userError) throw userError;

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
      return { success: false, error: (error as Error).message, payments: [] };
    }
  },

  verifyPayment: async (
    emiId: string,
    verified: boolean,
    paymentNotes: string,
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
      return {
        success: false,
        error: (error as Error).message,
        completed: false,
      };
    }
  },
};

const EMIManagement: NextPage = () => {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(
    null,
  );
  const [emis, setEmis] = useState<LoanEMI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEMIs, setIsLoadingEMIs] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
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

  useEffect(() => {
    const channel = supabase
      .channel("admin-loan-emis-all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loan_emis" },
        () => {
          loadPendingPayments();
          if (selectedLoan) loadEMIs(selectedLoan.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLoan]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-loan-applications")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "loan_applications" },
        () => loadLoans(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        () => loadEMIs(selectedLoan.id),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLoan]);

  const loadLoans = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await emiService.getDisbursedLoans();
      if (result.success) setLoans(result.loans);
      else setError(result.error || "Failed to load loans");
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEMIs = async (loanId: string) => {
    setIsLoadingEMIs(true);
    try {
      const result = await emiService.getEMIsForLoan(loanId);
      if (result.success) setEmis(result.emis);
      else setError(result.error || "Failed to load EMIs");
    } catch (err) {
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
      if (result.success) setPendingPayments(result.payments);
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
        selectedEMI.emi_amount,
      );

      if (result.success) {
        await loadEMIs(selectedLoan!.id);
        const completionResult = await emiService.checkAndCompleteLoan(
          selectedLoan!.id,
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
      setError("Something went wrong");
    }
  };

  const handleReviewPayment = (payment: PendingPayment) => {
    setSelectedPaymentReview(payment);
    setShowPaymentReviewModal(true);
  };

  const handleVerifyPayment = async (verified: boolean) => {
    if (!selectedPaymentReview || !selectedLoan) return;

    try {
      const result = await emiService.verifyPayment(
        selectedPaymentReview.emi_id,
        verified,
        verified ? "Payment verified by admin" : "Payment rejected by admin",
      );

      if (result.success) {
        await emiService.checkAndCompleteLoan(selectedLoan.id);
        await loadLoans();
        await loadPendingPayments();
        await loadEMIs(selectedLoan.id);
        setShowPaymentReviewModal(false);
        setSelectedPaymentReview(null);
      }
    } catch (err) {
      console.error("Verify payment error:", err);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadLoans();
    await loadPendingPayments();
    if (selectedLoan) await loadEMIs(selectedLoan.id);
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "overdue":
        return "bg-red-50 text-red-600 border-red-100";
      case "partial":
        return "bg-blue-50 text-blue-600 border-blue-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-3 h-3" />;
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "overdue":
        return <XCircle className="w-3 h-3" />;
      case "partial":
        return <DollarSign className="w-3 h-3" />;
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
    <div className="min-h-screen bg-[#F4F7FE] p-3 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#03A9F4] to-[#0288D1] flex items-center justify-center shadow-sm">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#2B3674]">
                EMI Management
              </h1>
              <p className="text-xs text-[#A3AED0]">
                {loans.length} active loans
              </p>
            </div>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#03A9F4] bg-white rounded-md hover:bg-[#E3F2FD] transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-400 hover:text-red-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left: Loans List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100/50">
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A3AED0]" />
                  <input
                    type="text"
                    placeholder="Search loans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-xs text-[#2B3674] focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] transition-all"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 text-[#03A9F4] animate-spin mx-auto mb-2" />
                    <p className="text-xs text-[#A3AED0]">Loading...</p>
                  </div>
                ) : filteredLoans.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-[#A3AED0]">No loans found</p>
                  </div>
                ) : (
                  filteredLoans.map((loan) => (
                    <button
                      key={loan.id}
                      onClick={() => handleSelectLoan(loan)}
                      className={`w-full text-left p-3 hover:bg-gray-50/50 transition-colors ${
                        selectedLoan?.id === loan.id
                          ? "bg-[#03A9F4]/5 border-l-2 border-[#03A9F4]"
                          : ""
                      }`}
                    >
                      <p className="text-sm font-medium text-[#2B3674]">
                        {loan.users?.name || "Unknown"}
                      </p>
                      <p className="text-[10px] text-[#A3AED0]">
                        {loan.loan_type}
                      </p>
                      <p className="text-[10px] text-[#A3AED0] mt-0.5">
                        ₹{loan.loan_amount.toLocaleString("en-IN")} •{" "}
                        {loan.tenure}{" "}
                        {loan.payment_type === "weekly" ? "wk" : "mo"}
                      </p>
                      {loan.status === "completed" && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] rounded font-medium">
                          <Check className="w-2.5 h-2.5" />
                          Completed
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-100/50 p-12 text-center">
                <Calendar className="w-10 h-10 text-[#A3AED0] mx-auto mb-3" />
                <p className="text-sm text-[#A3AED0]">
                  Select a loan to view EMI schedule
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100/50 overflow-hidden">
                {/* Loan Header */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#03A9F4]/5 to-transparent">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-[#2B3674]">
                        {selectedLoan.users?.name}
                      </h2>
                      <p className="text-[10px] text-[#A3AED0]">
                        {selectedLoan.loan_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#A3AED0] uppercase">
                        Total
                      </p>
                      <p className="text-lg font-bold text-[#2B3674]">
                        ₹{selectedLoan.total_payable.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white/50 rounded p-2 text-center">
                      <p className="text-[9px] text-[#A3AED0] uppercase">
                        Principal
                      </p>
                      <p className="text-xs font-semibold text-[#2B3674]">
                        ₹{selectedLoan.loan_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded p-2 text-center">
                      <p className="text-[9px] text-red-500 uppercase">
                        Disbursement
                      </p>
                      <p className="text-xs font-semibold text-red-500">
                        -{selectedLoan.disbursement_interest}%
                      </p>
                    </div>
                    <div className="bg-white/50 rounded p-2 text-center">
                      <p className="text-[9px] text-amber-600 uppercase">
                        Repayment
                      </p>
                      <p className="text-xs font-semibold text-amber-600">
                        +{selectedLoan.repayment_interest}%
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  {emis.length > 0 && (
                    <div className="bg-white/50 rounded p-2">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-[#A3AED0]">Progress</span>
                        <span className="font-medium text-[#2B3674]">
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
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${calculateProgress(emis, selectedLoan.total_payable).percentage}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] mt-1">
                        <span className="text-emerald-600 font-medium">
                          ₹
                          {calculateProgress(
                            emis,
                            selectedLoan.total_payable,
                          ).paidAmount.toLocaleString("en-IN")}{" "}
                          paid
                        </span>
                        <span className="text-[#A3AED0]">
                          ₹
                          {(
                            calculateProgress(emis, selectedLoan.total_payable)
                              .totalAmount -
                            calculateProgress(emis, selectedLoan.total_payable)
                              .paidAmount
                          ).toLocaleString("en-IN")}{" "}
                          left
                        </span>
                      </div>
                    </div>
                  )}

                  {emis.length > 0 &&
                    emis.every((emi) => emi.status === "paid") &&
                    selectedLoan.status !== "completed" && (
                      <button
                        onClick={async () => {
                          const { error } = await supabase
                            .from("loan_applications")
                            .update({
                              status: "completed",
                              completed_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            })
                            .eq("id", selectedLoan.id);

                          if (!error) {
                            alert("Loan marked as completed");
                            await loadLoans();
                            setSelectedLoan(null);
                            setEmis([]);
                          }
                        }}
                        className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}
                </div>

                {/* EMI List */}
                <div className="p-3">
                  <p className="text-[10px] font-medium text-[#A3AED0] uppercase mb-2">
                    EMI Schedule
                  </p>

                  {isLoadingEMIs ? (
                    <div className="py-8 text-center">
                      <Loader2 className="w-6 h-6 text-[#03A9F4] animate-spin mx-auto mb-2" />
                      <p className="text-xs text-[#A3AED0]">Loading...</p>
                    </div>
                  ) : emis.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-[#A3AED0]">No EMIs found</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {emis.map((emi, index) => {
                        const isLastEMI = index === emis.length - 1;
                        const lastEMIAmount =
                          selectedLoan.last_installment_amount;
                        const showLastEMINote =
                          isLastEMI &&
                          lastEMIAmount &&
                          lastEMIAmount !== selectedLoan.installment_amount;

                        const pendingPayment = pendingPayments.find(
                          (p) => p.emi_id === emi.id,
                        );

                        return (
                          <div
                            key={emi.id}
                            className="flex items-center justify-between p-2.5 bg-gray-50/50 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-[#2B3674]">
                                  {emi.emi_number}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-[#2B3674]">
                                  ₹{emi.emi_amount.toLocaleString("en-IN")}
                                  {showLastEMINote && (
                                    <span className="ml-1 text-[9px] text-amber-600">
                                      (Last)
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-[#A3AED0]">
                                  Due: {formatDate(emi.due_date)}
                                  {(emi.paid_amount || 0) > 0 && (
                                    <span className="ml-1 text-emerald-600">
                                      • Paid: ₹
                                      {(emi.paid_amount || 0).toLocaleString(
                                        "en-IN",
                                      )}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border ${getStatusStyle(emi.status)}`}
                              >
                                {getStatusIcon(emi.status)}
                                {emi.status}
                              </span>

                              {pendingPayment && (
                                <button
                                  onClick={() =>
                                    handleReviewPayment(pendingPayment)
                                  }
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] rounded font-medium transition-colors"
                                >
                                  <Image className="w-3 h-3" />
                                  Review
                                </button>
                              )}

                              {emi.status !== "paid" && !pendingPayment && (
                                <button
                                  onClick={() => handleMarkPayment(emi)}
                                  className="p-1.5 text-[#03A9F4] hover:bg-[#F4F7FE] rounded transition-colors"
                                  title="Mark Payment"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-[#2B3674]">
                Record Payment - EMI #{selectedEMI.emi_number}
              </h3>
            </div>

            <div className="p-4 space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#A3AED0]">EMI Amount</span>
                  <span className="font-medium text-[#2B3674]">
                    ₹{selectedEMI.emi_amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#A3AED0]">Already Paid</span>
                  <span className="font-medium text-emerald-600">
                    ₹{(selectedEMI.paid_amount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-gray-200">
                  <span className="font-medium text-[#2B3674]">Remaining</span>
                  <span className="font-bold text-red-600">
                    ₹
                    {Math.max(
                      0,
                      selectedEMI.emi_amount - (selectedEMI.paid_amount || 0),
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#A3AED0] uppercase mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#A3AED0] uppercase mb-1">
                  Notes
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  rows={2}
                  placeholder="Reference, mode..."
                />
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedEMI(null);
                  setPaymentAmount("");
                  setPaymentNotes("");
                }}
                className="px-3 py-1.5 text-xs font-medium text-[#A3AED0] hover:text-[#2B3674] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-md text-xs font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Review Modal */}
      {showPaymentReviewModal && selectedPaymentReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#2B3674]">
                Review Payment - EMI #{selectedPaymentReview.emi_number}
              </h3>
              <button
                onClick={() => {
                  setShowPaymentReviewModal(false);
                  setSelectedPaymentReview(null);
                }}
                className="p-1 text-[#A3AED0] hover:text-[#2B3674] hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-[9px] text-[#A3AED0] uppercase">User</p>
                  <p className="text-xs font-medium text-[#2B3674]">
                    {selectedPaymentReview.user_name}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-[#A3AED0] uppercase">Amount</p>
                  <p className="text-xs font-medium text-[#2B3674]">
                    ₹{selectedPaymentReview.emi_amount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-[#A3AED0] uppercase">
                    Loan Type
                  </p>
                  <p className="text-xs font-medium text-[#2B3674]">
                    {selectedPaymentReview.loan_type}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-[#A3AED0] uppercase">
                    Submitted
                  </p>
                  <p className="text-xs font-medium text-[#2B3674]">
                    {formatDate(selectedPaymentReview.payment_submitted_at)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium text-[#A3AED0] uppercase mb-1.5">
                  Payment Screenshot
                </p>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={selectedPaymentReview.payment_screenshot_url}
                    alt="Payment Screenshot"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleVerifyPayment(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => handleVerifyPayment(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EMIManagement;
