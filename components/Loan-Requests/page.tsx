"use client";
import { useState, useEffect } from "react";
import { NextPage } from "next";
import { supabase } from "@/lib/supabaseClient";
import { FileText } from "lucide-react";

// SVG Icons (keeping all existing icons)
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

const EyeIcon = () => (
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
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const CheckIcon = () => (
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
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const XIcon = () => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const ClockIcon = () => (
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
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const FilterIcon = () => (
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
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
    />
  </svg>
);

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

const ImageIcon = () => (
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
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const DocumentIcon = () => (
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
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ProcessingIcon = () => (
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

const MoneyIcon = () => (
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
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

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

// Utility Functions
const getImageUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from("user-documents").getPublicUrl(path);
  return data.publicUrl;
};

// Service
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
        console.error("Error fetching users:", userError);
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
      console.error("Get loan applications error:", error);
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
    reviewerNotes?: string
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

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", application.user_id)
        .single();

      if (userError) {
        console.error("Error fetching user:", userError);
      }

      return {
        success: true,
        application: {
          ...application,
          users: user || null,
        },
      };
    } catch (error) {
      console.error("Update application status error:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  disburseLoan: async (
    applicationId: string,
    disbursedAmount: number,
    disbursementNotes: string
  ) => {
    try {
      // Get application details
      const { data: application, error: fetchError } = await supabase
        .from("loan_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (fetchError) throw fetchError;
      if (!application) throw new Error("Application not found");

      // Update application status to disbursed
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

      // Generate EMI schedule
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

      // Insert EMIs
      const { error: emiError } = await supabase.from("loan_emis").insert(emis);

      if (emiError) throw emiError;

      // Fetch user
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", updatedApp.user_id)
        .single();

      return {
        success: true,
        application: {
          ...updatedApp,
          users: user || null,
        },
      };
    } catch (error) {
      console.error("Disburse loan error:", error);
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
      console.error("Get EMIs error:", error);
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
    new Set()
  );

  // New states for disbursement
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
      console.error("Load applications error:", err);
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
    notes?: string
  ) => {
    try {
      const result = await loanApplicationService.updateApplicationStatus(
        applicationId,
        status,
        notes
      );

      if (result.success && result.application) {
        setApplications(
          applications.map((app) =>
            app.id === applicationId ? result.application! : app
          )
        );

        if (selectedApplication && selectedApplication.id === applicationId) {
          setSelectedApplication(result.application!);
        }
      } else {
        setError(result.error || "Failed to update application status");
      }
    } catch (err) {
      console.error("Update application status error:", err);
      setError("Something went wrong while updating application status");
    }
  };

  const handleReviewSubmit = async () => {
    if (!applicationToReview) return;

    await handleUpdateApplicationStatus(
      applicationToReview.id,
      applicationToReview.action,
      reviewerNotes
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
        disbursementNotes
      );

      if (result.success && result.application) {
        setApplications(
          applications.map((app) =>
            app.id === applicationToDisburse ? result.application! : app
          )
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
      console.error("Disburse loan error:", err);
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
      console.error("Load EMIs error:", err);
      setError("Something went wrong while loading EMIs");
    }
  };

  const handleImageError = (imageSrc: string, error: any) => {
    console.error("Failed to load image:", imageSrc, error);
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
    indexOfLastApplication
  );
  const totalPages = Math.ceil(
    filteredApplications.length / applicationsPerPage
  );

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "disbursed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckIcon />;
      case "pending":
        return <ClockIcon />;
      case "rejected":
        return <XIcon />;
      case "processing":
        return <ProcessingIcon />;
      case "disbursed":
        return <MoneyIcon />;
      case "completed":
        return <CheckIcon />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    icon,
  }: {
    title: string;
    photos: string[];
    icon: React.ReactNode;
  }) => (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-medium text-gray-700">{title}</h4>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          {photos?.length || 0} photo{(photos?.length || 0) !== 1 ? "s" : ""}
        </span>
      </div>
      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((photoPath, index) => {
            const imageUrl = getImageUrl(photoPath);
            const hasError = imageLoadErrors.has(imageUrl);

            return (
              <div key={index} className="relative group">
                {hasError ? (
                  <div className="w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-red-300">
                    <div className="text-center">
                      <XIcon />
                      <p className="text-xs text-red-600 mt-1">
                        Failed to load
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={imageUrl}
                      alt={`${title} ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setSelectedImage(imageUrl);
                        setShowImageModal(true);
                      }}
                      onError={(e) => handleImageError(imageUrl, e)}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="text-white">
                        <EyeIcon />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No photos uploaded</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className=" shadow-sm">
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
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-800" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-black">
                    Loan Applications
                  </h1>
                </div>
              </div>
              <button
                onClick={refreshApplications}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-black hover:bg-black/10 rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                <div className={refreshing ? "animate-spin" : ""}>
                  <RefreshIcon />
                </div>
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700 ml-4"
            >
              <XIcon />
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {[
                { label: "Total", value: statusCounts.all, color: "gray" },
                {
                  label: "Approved",
                  value: statusCounts.approved,
                  color: "green",
                },
                {
                  label: "Pending",
                  value: statusCounts.pending,
                  color: "yellow",
                },
                {
                  label: "Processing",
                  value: statusCounts.processing,
                  color: "blue",
                },
                {
                  label: "Disbursed",
                  value: statusCounts.disbursed,
                  color: "purple",
                },
                {
                  label: "Completed",
                  value: statusCounts.completed,
                  color: "gray",
                },
                {
                  label: "Rejected",
                  value: statusCounts.rejected,
                  color: "red",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-lg p-2 shadow-sm"
                >
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className={`text-xl font-bold text-${stat.color}-600`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, loan type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <SearchIcon />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="disbursed">Disbursed</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">
                      Applicant
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">
                      Loan Details
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">
                      Total Payable
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">
                      EMI
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">
                      KYC
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">
                      Applied
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentApplications.map((app) => (
                    <tr key={app.id} className="border-t hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <p className="font-medium text-gray-900">
                          {app.users?.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {app.users?.email || "No email"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {app.users?.mobile_number || "No phone"}
                        </p>
                      </td>
                      <td className="py-2 px-3">
                        <p className="font-medium text-gray-900">
                          {app.loan_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          ₹{app.loan_amount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {app.tenure} {app.tenure_unit}
                        </p>
                      </td>
                      <td className="py-2 px-3">
                        <p className="text-lg font-bold text-green-600">
                          ₹{app.total_payable.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-gray-500">
                          Interest: ₹
                          {app.total_interest.toLocaleString("en-IN")}
                        </p>
                      </td>
                      <td className="py-2 px-3">
                        <p className="font-semibold text-yellow-600">
                          ₹{app.installment_amount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-gray-500">
                          /{app.payment_type === "weekly" ? "week" : "month"}
                        </p>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            app.users?.kyc_status || "pending"
                          )}`}
                        >
                          {getStatusIcon(app.users?.kyc_status || "pending")}
                          {app.users?.kyc_status
                            ? app.users.kyc_status.charAt(0).toUpperCase() +
                              app.users.kyc_status.slice(1).replace("_", " ")
                            : "Pending"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {getStatusIcon(app.status)}
                          {app.status.charAt(0).toUpperCase() +
                            app.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600">
                        {formatDate(app.applied_at)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowApplicationModal(true);
                          }}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                        >
                          <EyeIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-3 py-2 bg-gray-50 border-t flex items-center justify-between text-sm">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {filteredApplications.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <SearchIcon />
                <p className="text-gray-500 mt-4">No applications found</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Application Details Modal */}
      {showApplicationModal &&
        selectedApplication &&
        selectedApplication.users && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-6xl rounded-xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Loan Application Details
                  </h2>
                  <p className="text-sm text-gray-500">
                    Review complete application
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowApplicationModal(false);
                    setSelectedApplication(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XIcon />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Loan Summary */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Loan Summary
                  </h3>

                  {/* Highlighted Total Payable */}
                  <div className="bg-white rounded-lg p-4 mb-4 border-2 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Total Amount to be Repaid
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          ₹
                          {selectedApplication.total_payable.toLocaleString(
                            "en-IN"
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Principal: ₹
                          {selectedApplication.loan_amount.toLocaleString(
                            "en-IN"
                          )}{" "}
                          + Interest: ₹
                          {selectedApplication.total_interest.toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Loan Type</p>
                      <p className="font-semibold text-gray-900">
                        {selectedApplication.loan_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Principal Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹
                        {selectedApplication.loan_amount.toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Disbursement Interest
                      </p>
                      <p className="font-semibold text-red-600">
                        {selectedApplication.disbursement_interest}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Repayment Interest
                      </p>
                      <p className="font-semibold text-orange-600">
                        {selectedApplication.repayment_interest}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tenure</p>
                      <p className="font-semibold text-gray-900">
                        {selectedApplication.tenure}{" "}
                        {selectedApplication.tenure_unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedApplication.payment_type === "weekly"
                          ? "Weekly"
                          : "Monthly"}{" "}
                        EMI
                      </p>
                      <p className="text-lg font-bold text-yellow-700">
                        ₹
                        {selectedApplication.installment_amount.toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Interest</p>
                      <p className="text-lg font-bold text-red-600">
                        ₹
                        {selectedApplication.total_interest.toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Disbursement Info */}
                  {selectedApplication.status === "disbursed" && (
                    <div className="mt-4 pt-4 border-t border-yellow-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            Disbursed Amount
                          </p>
                          <p className="font-bold text-green-600">
                            ₹
                            {selectedApplication.disbursed_amount?.toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Disbursed At</p>
                          <p className="font-semibold text-gray-900">
                            {selectedApplication.disbursed_at
                              ? formatDate(selectedApplication.disbursed_at)
                              : "N/A"}
                          </p>
                        </div>
                        {selectedApplication.disbursement_notes && (
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600">
                              Disbursement Notes
                            </p>
                            <p className="text-gray-900 bg-white p-3 rounded-lg">
                              {selectedApplication.disbursement_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Applicant Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.users?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Age</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.users?.age || "N/A"} years
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.users?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mobile</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplication.users?.mobile_number || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">KYC Status</p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          selectedApplication.users?.kyc_status || "pending"
                        )}`}
                      >
                        {selectedApplication.users?.kyc_status || "Pending"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          selectedApplication.users?.payment_status || "pending"
                        )}`}
                      >
                        {selectedApplication.users?.payment_status || "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Screenshot */}
                {selectedApplication.users?.payment_screenshot_url && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Payment Screenshot
                    </h3>
                    <img
                      src={getImageUrl(
                        selectedApplication.users.payment_screenshot_url
                      )}
                      alt="Payment"
                      className="w-full max-w-md rounded-lg cursor-pointer"
                      onClick={() => {
                        setSelectedImage(
                          getImageUrl(
                            selectedApplication.users!.payment_screenshot_url!
                          )
                        );
                        setShowImageModal(true);
                      }}
                    />
                  </div>
                )}

                {/* KYC Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    KYC Documents
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DocumentSection
                      title="Aadhaar Front"
                      photos={
                        selectedApplication.users.aadhaar_front_photos || []
                      }
                      icon={<DocumentIcon />}
                    />
                    <DocumentSection
                      title="Aadhaar Back"
                      photos={
                        selectedApplication.users.aadhaar_back_photos || []
                      }
                      icon={<DocumentIcon />}
                    />
                    <DocumentSection
                      title="PAN Card"
                      photos={selectedApplication.users.pan_card_photos || []}
                      icon={<DocumentIcon />}
                    />
                    <DocumentSection
                      title="Bank Passbook"
                      photos={
                        selectedApplication.users.bank_passbook_photos || []
                      }
                      icon={<DocumentIcon />}
                    />
                  </div>
                  <div className="mt-4">
                    <DocumentSection
                      title="Passport Photos"
                      photos={
                        selectedApplication.users.passport_photo_urls || []
                      }
                      icon={<ImageIcon />}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Actions
                  </h3>
                  <div className="flex gap-3 flex-wrap">
                    {selectedApplication.status === "pending" && (
                      <button
                        onClick={() =>
                          handleUpdateApplicationStatus(
                            selectedApplication.id,
                            "processing"
                          )
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Mark as Processing
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
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
                            selectedApplication.loan_amount.toString()
                          );
                          setShowDisbursementModal(true);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                      >
                        <MoneyIcon />
                        Disburse Loan
                      </button>
                    )}

                    {selectedApplication.status === "disbursed" && (
                      <button
                        onClick={() => handleViewEMIs(selectedApplication.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        View EMI Schedule
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Disbursement Modal */}
      {showDisbursementModal && applicationToDisburse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Disburse Loan
            </h3>
            <p className="text-gray-600 mb-4">Enter disbursement details:</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disbursed Amount *
                </label>
                <input
                  type="number"
                  value={disbursementAmount}
                  onChange={(e) => setDisbursementAmount(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disbursement Notes
                </label>
                <textarea
                  value={disbursementNotes}
                  onChange={(e) => setDisbursementNotes(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400"
                  rows={3}
                  placeholder="Bank transfer details, reference number, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDisbursementModal(false);
                  setApplicationToDisburse(null);
                  setDisbursementAmount("");
                  setDisbursementNotes("");
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDisburseLoan}
                disabled={!disbursementAmount}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Disburse & Create EMI Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMI Schedule Modal */}
      {showEMIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">EMI Schedule</h3>
              <button
                onClick={() => setShowEMIModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon />
              </button>
            </div>

            <div className="p-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold">
                      EMI #
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold">
                      Due Date
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold">
                      Amount
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold">
                      Paid Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {emis.map((emi) => (
                    <tr key={emi.id} className="border-t">
                      <td className="py-2 px-3">{emi.emi_number}</td>
                      <td className="py-2 px-3">
                        {new Date(emi.due_date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-2 px-3">
                        ₹{emi.emi_amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            emi.status
                          )}`}
                        >
                          {emi.status.charAt(0).toUpperCase() +
                            emi.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        ₹{emi.paid_amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2"
            >
              <XIcon />
            </button>
            <img
              src={selectedImage}
              alt="Document"
              className="max-w-full max-h-[90vh] rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && applicationToReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {applicationToReview.action === "approved"
                ? "Approve Application"
                : "Reject Application"}
            </h3>
            <p className="text-gray-600 mb-4">
              {applicationToReview.action === "approved"
                ? "Add approval notes (optional):"
                : "Provide rejection reason:"}
            </p>
            <textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400"
              rows={4}
              placeholder={
                applicationToReview.action === "approved"
                  ? "Notes..."
                  : "Reason..."
              }
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setApplicationToReview(null);
                  setReviewerNotes("");
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={
                  applicationToReview.action === "rejected" &&
                  !reviewerNotes.trim()
                }
                className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                  applicationToReview.action === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
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
    </div>
  );
};

export default LoanApplications;
