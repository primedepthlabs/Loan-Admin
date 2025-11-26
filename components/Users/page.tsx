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

const ApproveIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4"
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

// TypeScript interfaces
interface User {
  id: string;
  name: string;
  age: number;
  email: string;
  mobile_number: string;
  can_login: boolean;
  aadhaar_front_photos: string[];
  aadhaar_back_photos: string[];
  pan_card_photos: string[];
  bank_passbook_photos: string[];
  passport_photo_urls: string[];
  kyc_status: "pending" | "approved" | "rejected" | "under_review";
  kyc_submitted_at: string;
  kyc_approved_at?: string;
  kyc_rejected_at?: string;
  kyc_rejection_reason?: string;
  // Payment fields
  payment_screenshot_url?: string;
  payment_status?: "pending" | "approved" | "rejected";
  payment_amount?: number;
  payment_submitted_at?: string;
  payment_approved_at?: string;
  payment_rejected_at?: string;
  created_at: string;
  updated_at: string;
  auth_user_id: string;
}

interface ServiceResponse<T> {
  success: boolean;
  error?: string;
  users?: T[];
  user?: T;
}

// Utility function to get proper image URL
const getImageUrl = (path: string): string => {
  if (!path) return "";

  // If it's already a full URL, return as is
  if (path.startsWith("http")) {
    return path;
  }

  // If it's a path, get the public URL
  const { data } = supabase.storage.from("user-documents").getPublicUrl(path);

  return data.publicUrl;
};

// Service functions
const userService = {
  getAllUsers: async (): Promise<ServiceResponse<User>> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, users: data || [] };
    } catch (error) {
      console.error("Get users error:", error);
      return { success: false, error: (error as Error).message, users: [] };
    }
  },

  updateLoginPermission: async (userId: string, canLogin: boolean) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ can_login: canLogin, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select();

      if (error) throw error;
      return { success: true, user: data?.[0] };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  updateKycStatus: async (
    userId: string,
    newStatus: string,
    rejectionReason?: string
  ): Promise<ServiceResponse<User>> => {
    try {
      const updateData: any = {
        kyc_status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "approved") {
        updateData.kyc_approved_at = new Date().toISOString();
        updateData.kyc_rejected_at = null;
        updateData.kyc_rejection_reason = null;
      } else if (newStatus === "rejected") {
        updateData.kyc_rejected_at = new Date().toISOString();
        updateData.kyc_approved_at = null;
        updateData.kyc_rejection_reason = rejectionReason || null;
      } else if (newStatus === "under_review") {
        updateData.kyc_approved_at = null;
        updateData.kyc_rejected_at = null;
        updateData.kyc_rejection_reason = null;
      }

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select();

      if (error) throw error;
      return { success: true, user: data?.[0] };
    } catch (error) {
      console.error("Update KYC status error:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  updatePaymentStatus: async (
    userId: string,
    newStatus: "approved" | "rejected"
  ): Promise<ServiceResponse<User>> => {
    try {
      const updateData: any = {
        payment_status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === "approved") {
        updateData.payment_approved_at = new Date().toISOString();
        updateData.can_login = true;
      } else if (newStatus === "rejected") {
        updateData.payment_rejected_at = new Date().toISOString();
        updateData.can_login = false;
      }

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select();

      if (error) throw error;
      return { success: true, user: data?.[0] };
    } catch (error) {
      console.error("Update payment status error:", error);
      return { success: false, error: (error as Error).message };
    }
  },
};

const Users: NextPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [usersPerPage] = useState<number>(10);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [showRejectionModal, setShowRejectionModal] = useState<boolean>(false);
  const [userToReject, setUserToReject] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );

  const handleUpdateLoginPermission = async (
    userId: string,
    canLogin: boolean
  ) => {
    const result = await userService.updateLoginPermission(userId, canLogin);
    if (result.success && result.user) {
      setUsers(users.map((u) => (u.id === userId ? result.user! : u)));
      if (selectedUser?.id === userId) setSelectedUser(result.user!);
    } else {
      setError(result.error || "Failed to update login permission");
    }
  };

  const handleUpdatePaymentStatus = async (
    userId: string,
    status: "approved" | "rejected"
  ) => {
    const result = await userService.updatePaymentStatus(userId, status);
    if (result.success && result.user) {
      setUsers(users.map((u) => (u.id === userId ? result.user! : u)));
      if (selectedUser?.id === userId) setSelectedUser(result.user!);
    } else {
      setError(result.error || "Failed to update payment status");
    }
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      const result = await userService.getAllUsers();

      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        setError(result.error || "Failed to load users");
      }
    } catch (err) {
      console.error("Load users error:", err);
      setError("Something went wrong while loading users");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = async (): Promise<void> => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  // Filter and search logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile_number.includes(searchTerm);

    const matchesKycFilter =
      filterStatus === "all" || user.kyc_status === filterStatus;

    const matchesPaymentFilter =
      paymentFilter === "all" || user.payment_status === paymentFilter;

    return matchesSearch && matchesKycFilter && matchesPaymentFilter;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleUpdateKycStatus = async (
    userId: string,
    newStatus: string,
    rejectionReason?: string
  ): Promise<void> => {
    try {
      const result = await userService.updateKycStatus(
        userId,
        newStatus,
        rejectionReason
      );

      if (result.success && result.user) {
        // Update local state
        setUsers(
          users.map((user) => (user.id === userId ? result.user! : user))
        );

        // Update selected user if modal is open
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(result.user!);
        }
      } else {
        setError(result.error || "Failed to update KYC status");
      }
    } catch (err) {
      console.error("Update KYC status error:", err);
      setError("Something went wrong while updating KYC status");
    }
  };

  const handleRejectKyc = async (): Promise<void> => {
    if (!userToReject) return;

    await handleUpdateKycStatus(userToReject, "rejected", rejectionReason);
    setShowRejectionModal(false);
    setUserToReject(null);
    setRejectionReason("");
    setShowUserModal(false);
  };

  const handleImageError = (imageSrc: string, error: any) => {
    console.error("Failed to load image:", imageSrc, error);
    setImageLoadErrors((prev) => new Set([...prev, imageSrc]));
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "under_review":
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
      case "under_review":
        return <EyeIcon />;
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

  const getTotalDocuments = (user: User): number => {
    return (
      (user.aadhaar_front_photos?.length || 0) +
      (user.aadhaar_back_photos?.length || 0) +
      (user.pan_card_photos?.length || 0) +
      (user.bank_passbook_photos?.length || 0) +
      (user.passport_photo_urls?.length || 0)
    );
  };

  const statusCounts = {
    all: users.length,
    approved: users.filter((u) => u.kyc_status === "approved").length,
    pending: users.filter((u) => u.kyc_status === "pending").length,
    rejected: users.filter((u) => u.kyc_status === "rejected").length,
    under_review: users.filter((u) => u.kyc_status === "under_review").length,
  };

  const paymentCounts = {
    all: users.length,
    approved: users.filter((u) => u.payment_status === "approved").length,
    pending: users.filter((u) => u.payment_status === "pending").length,
    rejected: users.filter((u) => u.payment_status === "rejected").length,
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
                  Balaji Finance
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshUsers}
                disabled={refreshing}
                className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Refresh Users"
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
            <p className="text-gray-500 text-lg">Loading users...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      Total Users
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
                      KYC Approved
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
                      KYC Pending
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
                      Payment Approved
                    </p>
                    <p className="text-xl font-semibold text-green-600 mt-1">
                      {paymentCounts.approved}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      Payment Pending
                    </p>
                    <p className="text-xl font-semibold text-yellow-600 mt-1">
                      {paymentCounts.pending}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      Payment Rejected
                    </p>
                    <p className="text-xl font-semibold text-red-600 mt-1">
                      {paymentCounts.rejected}
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
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors w-full sm:w-64"
                    />
                  </div>

                  {/* KYC Status Filter */}
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FilterIcon />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors appearance-none bg-white"
                    >
                      <option value="all">All KYC Status</option>
                      <option value="approved">KYC Approved</option>
                      <option value="pending">KYC Pending</option>
                      <option value="under_review">KYC Under Review</option>
                      <option value="rejected">KYC Rejected</option>
                    </select>
                  </div>

                  {/* Payment Status Filter */}
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <IndianRupeeIcon />
                    </div>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400 transition-colors appearance-none bg-white"
                    >
                      <option value="all">All Payment Status</option>
                      <option value="approved">Payment Approved</option>
                      <option value="pending">Payment Pending</option>
                      <option value="rejected">Payment Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Showing {currentUsers.length} of {filteredUsers.length} users
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                        User Details
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                        Contact Info
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                        KYC Status
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                        Payment
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                        Submitted
                      </th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((user: User) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-800">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Age: {user.age}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm text-gray-800">
                              {user.email}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user.mobile_number}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              user.kyc_status
                            )}`}
                          >
                            {getStatusIcon(user.kyc_status)}
                            {user.kyc_status.charAt(0).toUpperCase() +
                              user.kyc_status.slice(1).replace("_", " ")}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                user.payment_status || "pending"
                              )}`}
                            >
                              {getStatusIcon(user.payment_status || "pending")}
                              {user.payment_status
                                ? user.payment_status.charAt(0).toUpperCase() +
                                  user.payment_status.slice(1)
                                : "Pending"}
                            </span>
                            {user.payment_amount && (
                              <p className="text-xs text-gray-600 mt-1"></p>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <p className="text-sm text-gray-600">
                            {formatDate(
                              user.kyc_submitted_at || user.created_at
                            )}
                          </p>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-yellow-600 cursor-pointer hover:bg-yellow-50 rounded-lg transition-colors"
                              title="View Details & Documents"
                            >
                              <EyeIcon />
                            </button>
                            {!user.can_login ? (
                              <button
                                onClick={() =>
                                  handleUpdateLoginPermission(user.id, true)
                                }
                                className="p-2 text-emerald-600 hover:bg-emerald-50 cursor-pointer rounded-lg"
                                title="Allow Login"
                              >
                                <ApproveIcon />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleUpdateLoginPermission(user.id, false)
                                }
                                className="p-2 text-gray-600 hover:bg-gray-100 cursor-pointer rounded-lg"
                                title="Block Login"
                              >
                                <XIcon />
                              </button>
                            )}
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
            {filteredUsers.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon />
                </div>
                <p className="text-gray-500 text-lg">No users found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedUser.name}
                </h2>
                <p className="text-sm text-gray-500">
                  User Details, KYC & Payment Info
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
              >
                <XIcon />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Full Name
                    </label>
                    <p className="text-gray-800">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Age
                    </label>
                    <p className="text-gray-800">{selectedUser.age} years</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <p className="text-gray-800">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Mobile Number
                    </label>
                    <p className="text-gray-800">
                      {selectedUser.mobile_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <IndianRupeeIcon />
                  <span className="ml-2">Payment Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Payment Status
                    </label>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        selectedUser.payment_status || "pending"
                      )}`}
                    >
                      {getStatusIcon(selectedUser.payment_status || "pending")}
                      {selectedUser.payment_status
                        ? selectedUser.payment_status.charAt(0).toUpperCase() +
                          selectedUser.payment_status.slice(1)
                        : "Pending"}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Payment Amount
                    </label>
                    <p className="text-gray-800 font-semibold">
                      ₹{selectedUser.payment_amount || "N/A"}
                    </p>
                  </div>
                  {selectedUser.payment_submitted_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Submitted At
                      </label>
                      <p className="text-gray-800">
                        {formatDate(selectedUser.payment_submitted_at)}
                      </p>
                    </div>
                  )}
                  {selectedUser.payment_approved_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Approved At
                      </label>
                      <p className="text-gray-800">
                        {formatDate(selectedUser.payment_approved_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Screenshot */}
                {selectedUser.payment_screenshot_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Screenshot
                    </label>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img
                        src={getImageUrl(selectedUser.payment_screenshot_url)}
                        alt="Payment Screenshot"
                        className="w-full max-w-md h-auto object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setSelectedImage(
                            getImageUrl(selectedUser.payment_screenshot_url!)
                          );
                          setShowImageModal(true);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Payment Actions */}
                {selectedUser.payment_status !== "approved" ? (
                  // For pending and rejected - show Approve button (and Reject for pending only)
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Payment Actions
                    </h4>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          handleUpdatePaymentStatus(
                            selectedUser.id,
                            "approved"
                          );
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                      >
                        <CheckIcon />
                        Approve Payment
                      </button>
                      {selectedUser.payment_status === "pending" && (
                        <button
                          onClick={() => {
                            handleUpdatePaymentStatus(
                              selectedUser.id,
                              "rejected"
                            );
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          <XIcon />
                          Reject Payment
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  // For approved - show only Reject button
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Payment Actions
                    </h4>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          handleUpdatePaymentStatus(
                            selectedUser.id,
                            "rejected"
                          );
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        <XIcon />
                        Reject Payment
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* KYC Documents */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  KYC Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocumentSection
                    title="Aadhaar Front"
                    photos={selectedUser.aadhaar_front_photos || []}
                    icon={<DocumentIcon />}
                  />
                  <DocumentSection
                    title="Aadhaar Back"
                    photos={selectedUser.aadhaar_back_photos || []}
                    icon={<DocumentIcon />}
                  />
                  <DocumentSection
                    title="PAN Card"
                    photos={selectedUser.pan_card_photos || []}
                    icon={<DocumentIcon />}
                  />
                  <DocumentSection
                    title="Bank Passbook"
                    photos={selectedUser.bank_passbook_photos || []}
                    icon={<DocumentIcon />}
                  />
                </div>
                <div className="mt-4">
                  <DocumentSection
                    title="Passport Photos"
                    photos={selectedUser.passport_photo_urls || []}
                    icon={<ImageIcon />}
                  />
                </div>
              </div>

              {/* KYC Status Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  KYC Status Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Current Status
                    </label>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        selectedUser.kyc_status
                      )}`}
                    >
                      {getStatusIcon(selectedUser.kyc_status)}
                      {selectedUser.kyc_status.charAt(0).toUpperCase() +
                        selectedUser.kyc_status.slice(1).replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Submitted At
                    </label>
                    <p className="text-gray-800">
                      {formatDate(
                        selectedUser.kyc_submitted_at || selectedUser.created_at
                      )}
                    </p>
                  </div>
                  {selectedUser.kyc_approved_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Approved At
                      </label>
                      <p className="text-gray-800">
                        {formatDate(selectedUser.kyc_approved_at)}
                      </p>
                    </div>
                  )}
                  {selectedUser.kyc_rejected_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Rejected At
                      </label>
                      <p className="text-gray-800">
                        {formatDate(selectedUser.kyc_rejected_at)}
                      </p>
                    </div>
                  )}
                </div>
                {selectedUser.kyc_rejection_reason && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Rejection Reason
                    </label>
                    <p className="text-red-700 bg-red-50 p-3 rounded-lg">
                      {selectedUser.kyc_rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              {/* KYC Actions */}
              {(selectedUser.kyc_status === "pending" ||
                selectedUser.kyc_status === "under_review") && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    KYC Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedUser.kyc_status === "pending" && (
                      <button
                        onClick={() => {
                          handleUpdateKycStatus(
                            selectedUser.id,
                            "under_review"
                          );
                        }}
                        className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <EyeIcon />
                        Mark Under Review
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleUpdateKycStatus(selectedUser.id, "approved");
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 cursor-pointer text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckIcon />
                      Approve KYC
                    </button>
                    <button
                      onClick={() => {
                        setUserToReject(selectedUser.id);
                        setShowRejectionModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 cursor-pointer text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XIcon />
                      Reject KYC
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

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Reject KYC Application
              </h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this KYC application:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                rows={4}
                placeholder="Enter rejection reason..."
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setUserToReject(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 text-gray-600 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectKyc}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
