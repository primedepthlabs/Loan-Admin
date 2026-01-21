"use client";
import { useState, useEffect } from "react";
import { NextPage } from "next";
import { supabase } from "@/lib/supabaseClient";
import {
  FileText,
  Search,
  Eye,
  Check,
  X,
  Clock,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Banknote,
  XCircle,
  Loader2,
  Calendar,
} from "lucide-react";

// Interfaces
interface User {
  id: string;
  name: string;
  age: number;
  email: string;
  mobile_number: string;
  aadhaar_front_photos: string[];
  aadhaar_back_photos: string[];
  pan_card_photos: string[];
  bank_passbook_photos: string[];
  passport_photo_urls: string[];
  kyc_status: "pending" | "approved" | "rejected" | "under_review";
  payment_status?: "pending" | "approved" | "rejected";
  payment_screenshot_url?: string;
  payment_amount?: number;
}

interface LoanApplication {
  id: string;
  user_id: string;
  loan_option_id: string;
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
  payment_screenshot_url?: string;
  login_payment_amount?: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "processing"
    | "disbursed"
    | "completed";
  applied_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  disbursed_at?: string;
  disbursed_amount?: number;
  disbursement_notes?: string;
  users?: User | null;
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
}

const getImageUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from("user-documents").getPublicUrl(path);
  return data.publicUrl;
};

const loanApplicationService = {
  getAllApplications: async () => {
    try {
      const { data: applications, error: appError } = await supabase
        .from("loan_applications")
        .select("*")
        .order("applied_at", { ascending: false });

      if (appError) throw appError;

      if (!applications || applications.length === 0) {
        return { success: true, applications: [] };
      }

      const userIds = [
        ...new Set(applications.map((app) => app.user_id).filter(Boolean)),
      ];

      if (userIds.length === 0) {
        return {
          success: true,
          applications: applications.map((app) => ({ ...app, users: null })),
        };
      }

      const { data: users, error: userError } = await supabase
        .from("users")
        .select("*")
        .in("auth_user_id", userIds);

      if (userError) {
        return {
          success: true,
          applications: applications.map((app) => ({ ...app, users: null })),
        };
      }

      const usersMap = new Map(users?.map((u) => [u.auth_user_id, u]) || []);

      const result = applications.map((app) => ({
        ...app,
        users: usersMap.get(app.user_id) || null,
      }));

      return { success: true, applications: result };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        applications: [],
      };
    }
  },

  updateApplicationStatus: async (
    applicationId: string,
    newStatus: "approved" | "rejected" | "processing",
    reviewerNotes?: string,
  ) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewer_notes: reviewerNotes || null,
      };

      const { data: applications, error: appError } = await supabase
        .from("loan_applications")
        .update(updateData)
        .eq("id", applicationId)
        .select("*");

      if (appError) throw appError;

      const application = applications?.[0];
      if (!application) throw new Error("Application not found");

      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", application.user_id)
        .single();

      return {
        success: true,
        application: { ...application, users: user || null },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  disburseLoan: async (
    applicationId: string,
    disbursedAmount: number,
    disbursementNotes: string,
  ) => {
    try {
      const { data: application, error: fetchError } = await supabase
        .from("loan_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (fetchError) throw fetchError;
      if (!application) throw new Error("Application not found");

      const { data: updatedApp, error: updateError } = await supabase
        .from("loan_applications")
        .update({
          status: "disbursed",
          disbursed_at: new Date().toISOString(),
          disbursed_amount: disbursedAmount,
          disbursement_notes: disbursementNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)
        .select("*")
        .single();

      if (updateError) throw updateError;

      const emis: any[] = [];
      const numberOfInstallments = application.tenure;
      const startDate = new Date();

      for (let i = 1; i <= numberOfInstallments; i++) {
        const dueDate = new Date(startDate);
        if (application.payment_type === "weekly") {
          dueDate.setDate(dueDate.getDate() + i * 7);
        } else {
          dueDate.setMonth(dueDate.getMonth() + i);
        }

        emis.push({
          loan_application_id: applicationId,
          emi_number: i,
          due_date: dueDate.toISOString().split("T")[0],
          emi_amount:
            i === numberOfInstallments
              ? application.last_installment_amount ||
                application.installment_amount
              : application.installment_amount,
          status: "pending",
          paid_amount: 0,
        });
      }

      const { error: emiError } = await supabase.from("loan_emis").insert(emis);
      if (emiError) throw emiError;

      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", updatedApp.user_id)
        .single();

      return {
        success: true,
        application: { ...updatedApp, users: user || null },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  getEMIs: async (applicationId: string) => {
    try {
      const { data, error } = await supabase
        .from("loan_emis")
        .select("*")
        .eq("loan_application_id", applicationId)
        .order("emi_number", { ascending: true });

      if (error) throw error;
      return { success: true, emis: data || [] };
    } catch (error) {
      return { success: false, error: (error as Error).message, emis: [] };
    }
  },
};

const LoanApplications: NextPage = () => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedApplication, setSelectedApplication] =
    useState<LoanApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [applicationsPerPage] = useState(10);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [applicationToReview, setApplicationToReview] = useState<{
    id: string;
    action: "approved" | "rejected";
  } | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set(),
  );
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [disbursementAmount, setDisbursementAmount] = useState("");
  const [disbursementNotes, setDisbursementNotes] = useState("");
  const [applicationToDisburse, setApplicationToDisburse] = useState<
    string | null
  >(null);
  const [emis, setEmis] = useState<LoanEMI[]>([]);
  const [showEMIModal, setShowEMIModal] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await loanApplicationService.getAllApplications();
      if (result.success && result.applications) {
        setApplications(result.applications);
      } else {
        setError(result.error || "Failed to load loan applications");
      }
    } catch (err) {
      setError("Something went wrong while loading loan applications");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshApplications = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    status: "approved" | "rejected" | "processing",
    notes?: string,
  ) => {
    try {
      const result = await loanApplicationService.updateApplicationStatus(
        applicationId,
        status,
        notes,
      );
      if (result.success && result.application) {
        setApplications(
          applications.map((app) =>
            app.id === applicationId ? result.application! : app,
          ),
        );
        if (selectedApplication && selectedApplication.id === applicationId) {
          setSelectedApplication(result.application!);
        }
      } else {
        setError(result.error || "Failed to update application status");
      }
    } catch (err) {
      setError("Something went wrong while updating application status");
    }
  };

  const handleReviewSubmit = async () => {
    if (!applicationToReview) return;
    await handleUpdateApplicationStatus(
      applicationToReview.id,
      applicationToReview.action,
      reviewerNotes,
    );
    setShowReviewModal(false);
    setApplicationToReview(null);
    setReviewerNotes("");
    setShowApplicationModal(false);
  };

  const handleDisburseLoan = async () => {
    if (!applicationToDisburse || !disbursementAmount) return;
    try {
      const result = await loanApplicationService.disburseLoan(
        applicationToDisburse,
        parseFloat(disbursementAmount),
        disbursementNotes,
      );
      if (result.success && result.application) {
        setApplications(
          applications.map((app) =>
            app.id === applicationToDisburse ? result.application! : app,
          ),
        );
        if (
          selectedApplication &&
          selectedApplication.id === applicationToDisburse
        ) {
          setSelectedApplication(result.application!);
        }
        setShowDisbursementModal(false);
        setApplicationToDisburse(null);
        setDisbursementAmount("");
        setDisbursementNotes("");
        setShowApplicationModal(false);
        alert("Loan disbursed successfully! EMI schedule created.");
      } else {
        setError(result.error || "Failed to disburse loan");
      }
    } catch (err) {
      setError("Something went wrong while disbursing loan");
    }
  };

  const handleViewEMIs = async (applicationId: string) => {
    try {
      const result = await loanApplicationService.getEMIs(applicationId);
      if (result.success) {
        setEmis(result.emis);
        setShowEMIModal(true);
      } else {
        setError(result.error || "Failed to load EMIs");
      }
    } catch (err) {
      setError("Something went wrong while loading EMIs");
    }
  };

  const handleImageError = (imageSrc: string) => {
    setImageLoadErrors((prev) => new Set([...prev, imageSrc]));
  };

  const filteredApplications = applications.filter((app) => {
    const user = app.users;
    const matchesSearch =
      app.loan_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user?.name &&
        user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user?.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user?.mobile_number && user.mobile_number.includes(searchTerm));
    const matchesFilter = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const indexOfLastApplication = currentPage * applicationsPerPage;
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
  const currentApplications = filteredApplications.slice(
    indexOfFirstApplication,
    indexOfLastApplication,
  );
  const totalPages = Math.ceil(
    filteredApplications.length / applicationsPerPage,
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "rejected":
        return "bg-red-50 text-red-600 border-red-100";
      case "processing":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "disbursed":
        return "bg-purple-50 text-purple-600 border-purple-100";
      case "completed":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <Check className="w-3 h-3" />;
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "rejected":
        return <X className="w-3 h-3" />;
      case "processing":
        return <RefreshCw className="w-3 h-3" />;
      case "disbursed":
        return <Banknote className="w-3 h-3" />;
      case "completed":
        return <Check className="w-3 h-3" />;
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

  const statusCounts = {
    all: applications.length,
    approved: applications.filter((a) => a.status === "approved").length,
    pending: applications.filter((a) => a.status === "pending").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    processing: applications.filter((a) => a.status === "processing").length,
    disbursed: applications.filter((a) => a.status === "disbursed").length,
    completed: applications.filter((a) => a.status === "completed").length,
  };

  const DocumentSection = ({
    title,
    photos,
  }: {
    title: string;
    photos: string[];
  }) => (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[#2B3674]">{title}</p>
        <span className="text-[9px] px-1.5 py-0.5 bg-[#03A9F4]/10 text-[#03A9F4] rounded font-medium">
          {photos?.length || 0}
        </span>
      </div>
      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photoPath, index) => {
            const imageUrl = getImageUrl(photoPath);
            const hasError = imageLoadErrors.has(imageUrl);
            return (
              <div key={index} className="relative group">
                {hasError ? (
                  <div className="w-full h-12 bg-gray-200 rounded flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt={`${title} ${index + 1}`}
                    className="w-full h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      setSelectedImage(imageUrl);
                      setShowImageModal(true);
                    }}
                    onError={() => handleImageError(imageUrl)}
                    loading="lazy"
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-[#A3AED0]">No photos</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-3 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#03A9F4] to-[#0288D1] flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#2B3674]">
                Loan Applications
              </h1>
              <p className="text-xs text-[#A3AED0]">
                {applications.length} total applications
              </p>
            </div>
          </div>
          <button
            onClick={refreshApplications}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#03A9F4] bg-[#F4F7FE] rounded-md hover:bg-[#E3F2FD] transition-colors disabled:opacity-50"
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

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#03A9F4] animate-spin" />
            <p className="text-[#A3AED0] text-sm mt-3">
              Loading applications...
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {[
                {
                  label: "Total",
                  count: statusCounts.all,
                  color: "text-[#2B3674]",
                  bg: "bg-white",
                },
                {
                  label: "Pending",
                  count: statusCounts.pending,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  label: "Processing",
                  count: statusCounts.processing,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Approved",
                  count: statusCounts.approved,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Disbursed",
                  count: statusCounts.disbursed,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                {
                  label: "Completed",
                  count: statusCounts.completed,
                  color: "text-gray-600",
                  bg: "bg-gray-100",
                },
                {
                  label: "Rejected",
                  count: statusCounts.rejected,
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`${stat.bg} rounded-lg p-2 border border-gray-100/50`}
                >
                  <p className="text-[9px] text-[#A3AED0] uppercase font-medium truncate">
                    {stat.label}
                  </p>
                  <p className={`text-lg font-bold ${stat.color}`}>
                    {stat.count}
                  </p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100/50 flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A3AED0]" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 w-full sm:w-48 border border-gray-200 rounded-md text-xs text-[#2B3674] focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] transition-all"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A3AED0]" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-8 pr-6 py-1.5 border border-gray-200 rounded-md text-xs text-[#2B3674] focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] transition-all appearance-none bg-white"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="approved">Approved</option>
                    <option value="disbursed">Disbursed</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-[#A3AED0]">
                Showing {currentApplications.length} of{" "}
                {filteredApplications.length}
              </p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-2.5 px-3 text-[10px] font-medium text-[#A3AED0] uppercase">
                        Applicant
                      </th>
                      <th className="text-left py-2.5 px-3 text-[10px] font-medium text-[#A3AED0] uppercase">
                        Loan
                      </th>
                      <th className="text-left py-2.5 px-3 text-[10px] font-medium text-[#A3AED0] uppercase">
                        Payable
                      </th>
                      <th className="text-left py-2.5 px-3 text-[10px] font-medium text-[#A3AED0] uppercase">
                        EMI
                      </th>
                      <th className="text-left py-2.5 px-3 text-[10px] font-medium text-[#A3AED0] uppercase">
                        Status
                      </th>
                      <th className="text-left py-2.5 px-3 text-[10px] font-medium text-[#A3AED0] uppercase">
                        Date
                      </th>
                      <th className="text-center py-2.5 px-3 text-[10px] font-medium text-[#A3AED0] uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentApplications.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <p className="text-sm font-medium text-[#2B3674]">
                            {app.users?.name || "Unknown"}
                          </p>
                          <p className="text-[10px] text-[#A3AED0] truncate max-w-[120px]">
                            {app.users?.mobile_number || "No phone"}
                          </p>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-xs font-medium text-[#2B3674]">
                            {app.loan_type}
                          </p>
                          <p className="text-[10px] text-[#A3AED0]">
                            ₹{app.loan_amount.toLocaleString("en-IN")} •{" "}
                            {app.tenure} {app.tenure_unit}
                          </p>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-sm font-semibold text-emerald-600">
                            ₹{app.total_payable.toLocaleString("en-IN")}
                          </p>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-xs font-medium text-amber-600">
                            ₹{app.installment_amount.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[9px] text-[#A3AED0]">
                            /{app.payment_type === "weekly" ? "wk" : "mo"}
                          </p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border ${getStatusStyle(app.status)}`}
                          >
                            {getStatusIcon(app.status)}
                            {app.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-xs text-[#2B3674]">
                            {formatDate(app.applied_at)}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedApplication(app);
                              setShowApplicationModal(true);
                            }}
                            className="p-1.5 text-[#03A9F4] hover:bg-[#F4F7FE] rounded transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <p className="text-[10px] text-[#A3AED0]">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 text-[#2B3674] hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-1.5 text-[#2B3674] hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {filteredApplications.length === 0 && (
                <div className="p-12 text-center">
                  <Search className="w-8 h-8 text-[#A3AED0] mx-auto mb-2" />
                  <p className="text-sm text-[#A3AED0]">
                    No applications found
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Application Details Modal */}
      {showApplicationModal &&
        selectedApplication &&
        selectedApplication.users && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#03A9F4]/5 to-transparent">
                <h3 className="text-sm font-semibold text-[#2B3674]">
                  Loan Application
                </h3>
                <button
                  onClick={() => {
                    setShowApplicationModal(false);
                    setSelectedApplication(null);
                  }}
                  className="p-1 text-[#A3AED0] hover:text-[#2B3674] hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                {/* Loan Summary */}
                <div className="bg-gradient-to-r from-emerald-50 to-transparent rounded-lg p-4 border border-emerald-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-emerald-700">
                      Total Repayable
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                      ₹
                      {selectedApplication.total_payable.toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white/50 rounded p-2">
                      <p className="text-[9px] text-[#A3AED0] uppercase">
                        Principal
                      </p>
                      <p className="text-xs font-semibold text-[#2B3674]">
                        ₹
                        {selectedApplication.loan_amount.toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded p-2">
                      <p className="text-[9px] text-[#A3AED0] uppercase">
                        Interest
                      </p>
                      <p className="text-xs font-semibold text-red-600">
                        ₹
                        {selectedApplication.total_interest.toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded p-2">
                      <p className="text-[9px] text-[#A3AED0] uppercase">
                        Tenure
                      </p>
                      <p className="text-xs font-semibold text-[#2B3674]">
                        {selectedApplication.tenure}{" "}
                        {selectedApplication.tenure_unit}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded p-2">
                      <p className="text-[9px] text-[#A3AED0] uppercase">EMI</p>
                      <p className="text-xs font-semibold text-amber-600">
                        ₹
                        {selectedApplication.installment_amount.toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Applicant Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-[#A3AED0] uppercase">
                      Applicant
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[9px] text-[#A3AED0] uppercase">
                          Name
                        </p>
                        <p className="font-medium text-[#2B3674]">
                          {selectedApplication.users?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#A3AED0] uppercase">
                          Age
                        </p>
                        <p className="font-medium text-[#2B3674]">
                          {selectedApplication.users?.age}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] text-[#A3AED0] uppercase">
                          Phone
                        </p>
                        <p className="font-medium text-[#2B3674]">
                          {selectedApplication.users?.mobile_number}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-[#A3AED0] uppercase">
                      Status
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#A3AED0]">Loan:</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border ${getStatusStyle(selectedApplication.status)}`}
                        >
                          {selectedApplication.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#A3AED0]">KYC:</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border ${getStatusStyle(selectedApplication.users?.kyc_status || "pending")}`}
                        >
                          {selectedApplication.users?.kyc_status || "pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Documents */}
                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-[#A3AED0] uppercase">
                    Documents
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <DocumentSection
                      title="Aadhaar Front"
                      photos={
                        selectedApplication.users.aadhaar_front_photos || []
                      }
                    />
                    <DocumentSection
                      title="Aadhaar Back"
                      photos={
                        selectedApplication.users.aadhaar_back_photos || []
                      }
                    />
                    <DocumentSection
                      title="PAN Card"
                      photos={selectedApplication.users.pan_card_photos || []}
                    />
                    <DocumentSection
                      title="Bank Passbook"
                      photos={
                        selectedApplication.users.bank_passbook_photos || []
                      }
                    />
                  </div>

                  {/* Payment Screenshot Section - ADD THIS */}
                  {selectedApplication.payment_screenshot_url && (
                    <div className="mt-2">
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-[#2B3674]">
                            Payment Screenshot
                          </p>
                          {selectedApplication.login_payment_amount && (
                            <span className="text-xs font-semibold text-yellow-700">
                              ₹{selectedApplication.login_payment_amount}
                            </span>
                          )}
                        </div>
                        <img
                          src={selectedApplication.payment_screenshot_url}
                          alt="Payment Screenshot"
                          className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setSelectedImage(
                              selectedApplication.payment_screenshot_url!,
                            );
                            setShowImageModal(true);
                          }}
                          onError={() =>
                            handleImageError(
                              selectedApplication.payment_screenshot_url!,
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2 flex-wrap">
                {selectedApplication.status === "pending" && (
                  <button
                    onClick={() =>
                      handleUpdateApplicationStatus(
                        selectedApplication.id,
                        "processing",
                      )
                    }
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors"
                  >
                    Processing
                  </button>
                )}
                {(selectedApplication.status === "pending" ||
                  selectedApplication.status === "processing") && (
                  <>
                    <button
                      onClick={() => {
                        setApplicationToReview({
                          id: selectedApplication.id,
                          action: "approved",
                        });
                        setShowReviewModal(true);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setApplicationToReview({
                          id: selectedApplication.id,
                          action: "rejected",
                        });
                        setShowReviewModal(true);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedApplication.status === "approved" && (
                  <button
                    onClick={() => {
                      setApplicationToDisburse(selectedApplication.id);
                      setDisbursementAmount(
                        selectedApplication.loan_amount.toString(),
                      );
                      setShowDisbursementModal(true);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors flex items-center gap-1"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Disburse
                  </button>
                )}
                {selectedApplication.status === "disbursed" && (
                  <button
                    onClick={() => handleViewEMIs(selectedApplication.id)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    View EMIs
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Disbursement Modal */}
      {showDisbursementModal && applicationToDisburse && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-[#2B3674]">
                Disburse Loan
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-[#A3AED0] uppercase mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={disbursementAmount}
                  onChange={(e) => setDisbursementAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#A3AED0] uppercase mb-1">
                  Notes
                </label>
                <textarea
                  value={disbursementNotes}
                  onChange={(e) => setDisbursementNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  rows={2}
                  placeholder="Bank transfer details..."
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowDisbursementModal(false);
                  setApplicationToDisburse(null);
                  setDisbursementAmount("");
                  setDisbursementNotes("");
                }}
                className="px-3 py-1.5 text-xs font-medium text-[#A3AED0] hover:text-[#2B3674] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisburseLoan}
                disabled={!disbursementAmount}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1.5 rounded-md text-xs font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Disburse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMI Modal */}
      {showEMIModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-[#2B3674]">
                EMI Schedule
              </h3>
              <button
                onClick={() => setShowEMIModal(false)}
                className="p-1 text-[#A3AED0] hover:text-[#2B3674] hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="text-left py-2 px-2 text-[10px] font-medium text-[#A3AED0] uppercase">
                      #
                    </th>
                    <th className="text-left py-2 px-2 text-[10px] font-medium text-[#A3AED0] uppercase">
                      Due
                    </th>
                    <th className="text-left py-2 px-2 text-[10px] font-medium text-[#A3AED0] uppercase">
                      Amount
                    </th>
                    <th className="text-left py-2 px-2 text-[10px] font-medium text-[#A3AED0] uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {emis.map((emi) => (
                    <tr key={emi.id}>
                      <td className="py-2 px-2 text-xs text-[#2B3674]">
                        {emi.emi_number}
                      </td>
                      <td className="py-2 px-2 text-xs text-[#2B3674]">
                        {new Date(emi.due_date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-2 px-2 text-xs font-medium text-[#2B3674]">
                        ₹{emi.emi_amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded border ${getStatusStyle(emi.status)}`}
                        >
                          {emi.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && applicationToReview && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-[#2B3674]">
                {applicationToReview.action === "approved"
                  ? "Approve Application"
                  : "Reject Application"}
              </h3>
            </div>
            <div className="p-4">
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                className="w-full h-24 p-2.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] resize-none"
                placeholder={
                  applicationToReview.action === "approved"
                    ? "Notes (optional)..."
                    : "Rejection reason..."
                }
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setApplicationToReview(null);
                  setReviewerNotes("");
                }}
                className="px-3 py-1.5 text-xs font-medium text-[#A3AED0] hover:text-[#2B3674] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={
                  applicationToReview.action === "rejected" &&
                  !reviewerNotes.trim()
                }
                className={`px-4 py-1.5 rounded-md text-xs font-medium text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  applicationToReview.action === "approved"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {applicationToReview.action === "approved"
                  ? "Approve"
                  : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Document"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanApplications;
