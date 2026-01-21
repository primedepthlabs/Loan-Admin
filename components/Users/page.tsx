"use client";
import { useState, useEffect } from "react";
import { NextPage } from "next";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  Eye,
  Check,
  X,
  Clock,
  Filter,
  RefreshCw,
  Image,
  FileText,
  Users as UsersIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

const getImageUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http")) {
    return path;
  }
  const { data } = supabase.storage.from("user-documents").getPublicUrl(path);
  return data.publicUrl;
};

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
    rejectionReason?: string,
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
};

const Users: NextPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
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
    new Set(),
  );

  const handleUpdateLoginPermission = async (
    userId: string,
    canLogin: boolean,
  ) => {
    const result = await userService.updateLoginPermission(userId, canLogin);
    if (result.success && result.user) {
      setUsers(users.map((u) => (u.id === userId ? result.user! : u)));
      if (selectedUser?.id === userId) setSelectedUser(result.user!);
    } else {
      setError(result.error || "Failed to update login permission");
    }
  };

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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile_number.includes(searchTerm);

    const matchesKycFilter =
      filterStatus === "all" || user.kyc_status === filterStatus;

    return matchesSearch && matchesKycFilter;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleUpdateKycStatus = async (
    userId: string,
    newStatus: string,
    rejectionReason?: string,
  ): Promise<void> => {
    try {
      const result = await userService.updateKycStatus(
        userId,
        newStatus,
        rejectionReason,
      );

      if (result.success && result.user) {
        setUsers(
          users.map((user) => (user.id === userId ? result.user! : user)),
        );

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

  const handleImageError = (imageSrc: string) => {
    setImageLoadErrors((prev) => new Set([...prev, imageSrc]));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "rejected":
        return "bg-red-50 text-red-600 border-red-100";
      case "under_review":
        return "bg-blue-50 text-blue-600 border-blue-100";
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
      case "under_review":
        return <Eye className="w-3 h-3" />;
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
    all: users.length,
    approved: users.filter((u) => u.kyc_status === "approved").length,
    pending: users.filter((u) => u.kyc_status === "pending").length,
    rejected: users.filter((u) => u.kyc_status === "rejected").length,
    under_review: users.filter((u) => u.kyc_status === "under_review").length,
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
              <UsersIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#2B3674]">Users</h1>
              <p className="text-xs text-[#A3AED0]">
                {users.length} registered users
              </p>
            </div>
          </div>
          <button
            onClick={refreshUsers}
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
            <div className="w-8 h-8 border-2 border-[#03A9F4] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#A3AED0] text-sm mt-3">Loading users...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  label: "Total",
                  count: statusCounts.all,
                  color: "text-[#2B3674]",
                  bg: "bg-white",
                },
                {
                  label: "Approved",
                  count: statusCounts.approved,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Pending",
                  count: statusCounts.pending,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
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
                  className={`${stat.bg} rounded-lg p-3 border border-gray-100/50`}
                >
                  <p className="text-[10px] text-[#A3AED0] uppercase font-medium">
                    {stat.label}
                  </p>
                  <p className={`text-xl font-bold ${stat.color}`}>
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
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Review</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-[#A3AED0]">
                Showing {currentUsers.length} of {filteredUsers.length}
              </p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-2.5 px-4 text-[10px] font-medium text-[#A3AED0] uppercase">
                        User
                      </th>
                      <th className="text-left py-2.5 px-4 text-[10px] font-medium text-[#A3AED0] uppercase">
                        Contact
                      </th>
                      <th className="text-left py-2.5 px-4 text-[10px] font-medium text-[#A3AED0] uppercase">
                        Status
                      </th>
                      <th className="text-left py-2.5 px-4 text-[10px] font-medium text-[#A3AED0] uppercase">
                        Date
                      </th>
                      <th className="text-center py-2.5 px-4 text-[10px] font-medium text-[#A3AED0] uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-2.5 px-4">
                          <p className="text-sm font-medium text-[#2B3674]">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-[#A3AED0]">
                            Age: {user.age}
                          </p>
                        </td>
                        <td className="py-2.5 px-4">
                          <p className="text-xs text-[#2B3674] truncate max-w-[150px]">
                            {user.email}
                          </p>
                          <p className="text-[10px] text-[#A3AED0] font-mono">
                            {user.mobile_number}
                          </p>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border ${getStatusStyle(user.kyc_status)}`}
                          >
                            {getStatusIcon(user.kyc_status)}
                            {user.kyc_status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <p className="text-xs text-[#2B3674]">
                            {formatDate(
                              user.kyc_submitted_at || user.created_at,
                            )}
                          </p>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="p-1.5 text-[#03A9F4] hover:bg-[#F4F7FE] rounded transition-colors"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {!user.can_login ? (
                              <button
                                onClick={() =>
                                  handleUpdateLoginPermission(user.id, true)
                                }
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                title="Unblock"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleUpdateLoginPermission(user.id, false)
                                }
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Block"
                              >
                                <XCircle className="w-3.5 h-3.5" />
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
            </div>
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#03A9F4]/5 to-transparent">
              <h3 className="text-sm font-semibold text-[#2B3674]">
                User Details
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1 text-[#A3AED0] hover:text-[#2B3674] hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)] space-y-4">
              {/* Profile Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[10px] font-medium text-[#A3AED0] uppercase">
                    Profile
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[9px] text-[#A3AED0] uppercase">
                        Name
                      </p>
                      <p className="font-medium text-[#2B3674]">
                        {selectedUser.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#A3AED0] uppercase">Age</p>
                      <p className="font-medium text-[#2B3674]">
                        {selectedUser.age}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] text-[#A3AED0] uppercase">
                        Email
                      </p>
                      <p className="font-medium text-[#2B3674] truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] text-[#A3AED0] uppercase">
                        Phone
                      </p>
                      <p className="font-medium text-[#2B3674]">
                        {selectedUser.mobile_number}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-medium text-[#A3AED0] uppercase">
                    Status
                  </p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[9px] text-[#A3AED0] uppercase mb-1">
                        KYC Status
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border ${getStatusStyle(selectedUser.kyc_status)}`}
                      >
                        {getStatusIcon(selectedUser.kyc_status)}
                        {selectedUser.kyc_status.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#A3AED0] uppercase mb-1">
                        Login
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded ${selectedUser.can_login ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
                      >
                        {selectedUser.can_login ? "Allowed" : "Blocked"}
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
                    photos={selectedUser.aadhaar_front_photos}
                  />
                  <DocumentSection
                    title="Aadhaar Back"
                    photos={selectedUser.aadhaar_back_photos}
                  />
                  <DocumentSection
                    title="PAN Card"
                    photos={selectedUser.pan_card_photos}
                  />
                  <DocumentSection
                    title="Bank Passbook"
                    photos={selectedUser.bank_passbook_photos}
                  />
                  <DocumentSection
                    title="Passport Photo"
                    photos={selectedUser.passport_photo_urls}
                  />
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2">
              <button
                onClick={() =>
                  handleUpdateKycStatus(selectedUser.id, "approved")
                }
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors"
              >
                Approve KYC
              </button>
              <button
                onClick={() => {
                  setUserToReject(selectedUser.id);
                  setShowRejectionModal(true);
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors"
              >
                Reject KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-[#2B3674]">
                Reject Application
              </h3>
            </div>
            <div className="p-4">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full h-24 p-2.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason("");
                }}
                className="px-3 py-1.5 text-xs font-medium text-[#A3AED0] hover:text-[#2B3674] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectKyc}
                disabled={!rejectionReason.trim()}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-xs font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm
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
              alt="Full size"
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

export default Users;
