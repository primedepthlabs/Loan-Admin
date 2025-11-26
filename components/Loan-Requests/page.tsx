"use client";
import { useState, useEffect } from "react";
import { NextPage } from "next";
import { supabase } from "@/lib/supabaseClient";

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

const IndianRupeeIcon = () => (
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
      d="M9 8h6M9 12h6m-3 8l-3-3h6m-6 0h6m-3-5a3 3 0 100-6 3 3 0 000 6z"
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

// TypeScript interfaces
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
  tenure: number;
  tenure_unit: string;
  interest_rate: number;
  payment_type: "weekly" | "monthly";
  installment_amount: number;
  total_payable: number;
  total_interest: number;
  status: "pending" | "approved" | "rejected" | "processing";
  applied_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  // User details (joined)
  users?: User;
}

interface ServiceResponse<T> {
  success: boolean;
  error?: string;
  applications?: T[];
  application?: T;
}

// Utility function to get proper image URL
const getImageUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from("user-documents").getPublicUrl(path);
  return data.publicUrl;
};

// Service functions
const loanApplicationService = {
  getAllApplications: async (): Promise
    ServiceResponse<LoanApplication>
  > => {
    try {
      const { data, error } = await supabase
        .from("loan_applications")
        .select(
          `
          *,
          users (
            id,
            name,
            age,
            email,
            mobile_number,
            aadhaar_front_photos,
            aadhaar_back_photos,
            pan_card_photos,
            bank_passbook_photos,
            passport_photo_urls,
            kyc_status,
            payment_status,
            payment_screenshot_url,
            payment_amount
          )
        `
        )
        .order("applied_at", { ascending: false });

      if (error) throw error;
      return { success: true, applications: data || [] };
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
  ): Promise<ServiceResponse<LoanApplication>> => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewer_notes: reviewerNotes || null,
      };

      const { data, error } = await supabase
        .from("loan_applications")
        .update(updateData)
        .eq("id", applicationId)
        .select(
          `
          *,
          users (
            id,
            name,
            age,
            email,
            mobile_number,
            aadhaar_front_photos,
            aadhaar_back_photos,
            pan_card_photos,
            bank_passbook_photos,
            passport_photo_urls,
            kyc_status,
            payment_status,
            payment_screenshot_url,
            payment_amount
          )
        `
        );

      if (error) throw error;
      return { success: true, application: data?.[0] };
    } catch (error) {
      console.error("Update application status error:", error);
      return { success: false, error: (error as Error).message };
    }
  },
};

const LoanApplications: NextPage = () => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] =
    useState<LoanApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [applicationsPerPage] = useState<number>(10);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [reviewerNotes, setReviewerNotes] = useState<string>("");
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [applicationToReview, setApplicationToReview] = useState<{
    id: string;
    action: "approved" | "rejected";
  } | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );

  // Load applications on component mount
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async (): Promise<void> => {
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

  const refreshApplications = async (): Promise<void> => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    status: "approved" | "rejected" | "processing",
    notes?: string
  ): Promise<void> => {
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

  const handleReviewSubmit = async (): Promise<void> => {
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

  const handleImageError = (imageSrc: string, error: any) => {
    console.error("Failed to load image:", imageSrc, error);
    setImageLoadErrors((prev) => new Set([...prev, imageSrc]));
  };

  // Filter and search logic
  const filteredApplications = applications.filter((app) => {
    const user = app.users;
    const matchesSearch =
      app.loan_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.mobile_number.includes(searchTerm);

    const matchesFilter =
      filterStatus === "all" || app.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Pagination
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
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case "approved":
        return <CheckIcon />;
      case "pending":
        return <ClockIcon />;
      case "rejected":
        return <XIcon />;
      case "processing":
        return <ProcessingIcon />;
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center mr-3">
                <img
                  src="logo.png"
                  alt="logo"
                  className="w-6 h-6 rounded-full"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  Balaji Finance - Loan Applications
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshApplications}
                disabled={refreshing}
                className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Refresh Applications"
              >
                <div className={refreshing ? "animate-spin" : ""}>
                  <RefreshIcon />
                </div>
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700 cursor-pointer text-xs mt-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 text-lg">
              Loading loan applications...
            </p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      Total Applications
                    </p>
                    <p className="text-xl font-semibold text-gray-800 mt-1">
                      {statusCounts.all}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      Approved
                    </p>
                    <p className="text-xl font-semibold text-green-600 mt-1">
                      {statusCounts.approved}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      Pending Review
                    </p>
                    <p className="text-xl font-semibold text-yellow-600 mt-1">
                      {statusCounts.pending}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      Processing
                    </p>
                    <p className="text-xl font-semibold text-blue-600 mt-1">
                      {statusCounts.processing}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      Rejected
                    </p>
                    <p className="text-xl font-semibold text-red-600 mt-1">
                      {statusCounts.rejected}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  {/* Search */}
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <SearchIcon />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, email, loan type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors w-full sm:w-80"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FilterIcon />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors appearance-none bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Showing {currentApplications.length} of{" "}
                  {filteredApplications.length} applications
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                        Applicant Details
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                        Loan Details
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                        EMI & Total
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                        KYC Status
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                        Application Status
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                        Applied On
                      </th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentApplications.map((app: LoanApplication) => (
                      <tr
                        key={app.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-800">
                              {app.users?.name || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {app.users?.email || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {app.users?.mobile_number || "N/A"}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-800">
                              {app.loan_type}
                            </p>
                            <p className="text-sm text-gray-600">
                              ₹{app.loan_amount.toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {app.tenure} {app.tenure_unit} @{" "}
                              {app.interest_rate}%
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm font-semibold text-yellow-600">
                              ₹{app.installment_amount.toLocaleString("en-IN")}{" "}
                              / {app.payment_type === "weekly" ? "week" : "month"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Total: ₹
                              {app.total_payable.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              app.users?.kyc_status || "pending"
                            )}`}
                          >
                            {getStatusIcon(app.users?.kyc_status || "pending")}
                            {app.users?.kyc_status
                              ? app.users.kyc_status
                                  .charAt(0)
                                  .toUpperCase() +
                                app.users.kyc_status
                                  .slice(1)
                                  .replace("_", " ")
                              : "Pending"}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              app.status
                            )}`}
                          >
                            {getStatusIcon(app.status)}
                            {app.status.charAt(0).toUpperCase() +
                              app.status.slice(1)}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <p className="text-sm text-gray-600">
                            {formatDate(app.applied_at)}
                          </p>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setShowApplicationModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-yellow-600 cursor-pointer hover:bg-yellow-50 rounded-lg transition-colors"
                              title="View Full Details"
                            >
                              <EyeIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${
                          currentPage === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-600 hover:bg-gray-50 border cursor-pointer border-gray-200"
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-600 hover:bg-gray-50 border cursor-pointer border-gray-200"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* No results message */}
            {filteredApplications.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon />
                </div>
                <p className="text-gray-500 text-lg">
                  No loan applications found
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-xl shadow-lg my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Loan Application Details
                </h2>
                <p className="text-sm text-gray-500">
                  Review application and user information
                </p>
              </div>
              <button
                onClick={() => {
                  setShowApplicationModal(false);
                  setSelectedApplication(null);
                }}
                className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
              >
                <XIcon />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Loan Application Information */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <IndianRupeeIcon />
                  Loan Application Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Loan Type
                    </label>
                    <p className="text-gray-900 font-semibold">
                      {selectedApplication.loan_type}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Loan Amount
                    </label>
                    <p className="text-gray-900 font-semibold text-lg">
                      ₹
                      {selectedApplication.loan_amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Interest Rate
                    </label>
                    <p className="text-gray-900 font-semibold">
                      {selectedApplication.interest_rate}% per annum
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Tenure
                    </label>
                    <p className="text-gray-900 font-semibold">
                      {selectedApplication.tenure}{" "}
                      {selectedApplication.tenure_unit}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {selectedApplication.payment_type === "weekly"
                        ? "Weekly"
                        : "Monthly"}{" "}
                      EMI
                    </label>
                    <p className="text-yellow-700 font-bold text-lg">
                      ₹
                      {selectedApplication.installment_amount.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Total Payable
                    </label>
                    <p className="text-gray-900 font-semibold text-lg">
                      ₹
                      {selectedApplication.total_payable.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Total Interest
                    </label>
                    <p className="text-gray-900 font-semibold">
                      ₹
                      {selectedApplication.total_interest.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Application Status
                    </label>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        selectedApplication.status
                      )}`}
                    >
                      {getStatusIcon(selectedApplication.status)}
                      {selectedApplication.status.charAt(0).toUpperCase() +
                        selectedApplication.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Applied On
                    </label>
                    <p className="text-gray-900 font-semibold">
                      {formatDate(selectedApplication.applied_at)}
                    </p>
                  </div>
                </div>

                {selectedApplication.reviewed_at && (
                  <div className="mt-4 pt-4 border-t border-yellow-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Reviewed At
                        </label>
                        <p className="text-gray-900">
                          {formatDate(selectedApplication.reviewed_at)}
                        </p>
                      </div>
                      {selectedApplication.reviewer_notes && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Reviewer Notes
                          </label>
                          <p className="text-gray-900 bg-white p-3 rounded-lg">
                            {selectedApplication.reviewer_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Personal Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Applicant Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Full Name
                    </label>
                    <p className="text-gray-800">
                      {selectedApplication.users?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Age
                    </label>
                    <p className="text-gray-800">
                      {selectedApplication.users?.age || "N/A"} years
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <p className="text-gray-800">
                      {selectedApplication.users?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Mobile Number
                    </label>
                    <p className="text-gray-800">
                      {selectedApplication.users?.mobile_number || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      KYC Status
                    </label>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        selectedApplication.users?.kyc_status || "pending"
                      )}`}
                    >
                      {getStatusIcon(
                        selectedApplication.users?.kyc_status || "pending"
                      )}
                      {selectedApplication.users?.kyc_status
                        ? selectedApplication.users.kyc_status
                            .charAt(0)
                            .toUpperCase() +
                          selectedApplication.users.kyc_status
                            .slice(1)
                            .replace("_", " ")
                        : "Pending"}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Payment Status
                    </label>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        selectedApplication.users?.payment_status || "pending"
                      )}`}
                    >
                      {getStatusIcon(
                        selectedApplication.users?.payment_status || "pending"
                      )}
                      {selectedApplication.users?.payment_status
                        ? selectedApplication.users.payment_status
                            .charAt(0)
                            .toUpperCase() +
                          selectedApplication.users.payment_status.slice(1)
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Screenshot */}
              {selectedApplication.users?.payment_screenshot_url && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Payment Screenshot
                  </h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img
                      src={getImageUrl(
                        selectedApplication.users.payment_screenshot_url
                      )}
                      alt="Payment Screenshot"
                      className="w-full max-w-md h-auto object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
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
                </div>
              )}

              {/* KYC Documents */}
              {selectedApplication.users && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    KYC Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              )}

              {/* Application Actions */}
              {(selectedApplication.status === "pending" ||
                selectedApplication.status === "processing") && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Application Review Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedApplication.status === "pending" && (
                      <button
                        onClick={() => {
                          handleUpdateApplicationStatus(
                            selectedApplication.id,
                            "processing"
                          );
                        }}
                        className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ProcessingIcon />
                        Mark as Processing
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setApplicationToReview({
                          id: selectedApplication.id,
                          action: "approved",
                        });
                        setShowReviewModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 cursor-pointer text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckIcon />
                      Approve Application
                    </button>
                    <button
                      onClick={() => {
                        setApplicationToReview({
                          id: selectedApplication.id,
                          action: "rejected",
                        });
                        setShowReviewModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 cursor-pointer text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XIcon />
                      Reject Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute top-4 right-4 text-white cursor-pointer hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
            >
              <XIcon />
            </button>
            <img
              src={selectedImage}
              alt="Document"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && applicationToReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {applicationToReview.action === "approved"
                  ? "Approve Loan Application"
                  : "Reject Loan Application"}
              </h3>
              <p className="text-gray-600 mb-4">
                {applicationToReview.action === "approved"
                  ? "Add notes about the approval (optional):"
                  : "Please provide a reason for rejecting this application:"}
              </p>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                rows={4}
                placeholder={
                  applicationToReview.action === "approved"
                    ? "Enter approval notes (optional)..."
                    : "Enter rejection reason..."
                }
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setApplicationToReview(null);
                    setReviewerNotes("");
                  }}
                  className="px-4 py-2 text-gray-600 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={
                    applicationToReview.action === "rejected" &&
                    !reviewerNotes.trim()
                  }
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    applicationToReview.action === "approved"
                      ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                      : "bg-red-600 hover:bg-red-700 cursor-pointer"
                  }`}
                >
                  {applicationToReview.action === "approved"
                    ? "Approve"
                    : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanApplications;