"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Edit2, Trash2, Save, X, Upload, Image } from "lucide-react";

interface LoanOption {
  id?: string;
  type: string;
  type_hindi: string;
  amount: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  login_payment_amount?: string;
  payment_qr_url?: string;
  created_at?: string;
}

const AdminLoanManager: React.FC = () => {
  const [loanOptions, setLoanOptions] = useState<LoanOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [uploadingQr, setUploadingQr] = useState(false);
  const [formData, setFormData] = useState<LoanOption>({
    type: "Personal Loan",
    type_hindi: "व्यक्तिगत ऋण",
    amount: "",
    icon: "💰",
    is_active: true,
    sort_order: 1,
    login_payment_amount: "",
  });

  const availableIcons = [
    "💰",
    "⚡",
    "⭐",
    "📈",
    "💎",
    "💼",
    "🏆",
    "🎯",
    "💵",
    "🔥",
  ];

  useEffect(() => {
    fetchLoanOptions();
  }, []);

  const fetchLoanOptions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("loan_options")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setLoanOptions(data || []);
      setQrCodeUrl(data?.[0]?.payment_qr_url || "");
    } catch (error) {
      console.error("Error fetching loan options:", error);
      alert("Error fetching loan options");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      setUploadingQr(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `qr-code-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-qr-codes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-qr-codes")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from("loan_options")
        .update({ payment_qr_url: publicUrl })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (dbError) throw dbError;

      setQrCodeUrl(publicUrl);
      alert("QR Code uploaded successfully!");
      fetchLoanOptions();
    } catch (error: any) {
      alert(`Error uploading QR code: ${error.message || "Unknown error"}`);
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from("loan_options")
          .update({
            type: formData.type,
            type_hindi: formData.type_hindi,
            amount: formData.amount,
            icon: formData.icon,
            is_active: formData.is_active,
            sort_order: formData.sort_order,
            login_payment_amount: formData.login_payment_amount,
          })
          .eq("id", editingId);

        if (error) throw error;
        alert("Updated successfully!");
      } else {
        const { error } = await supabase.from("loan_options").insert([
          {
            type: formData.type,
            type_hindi: formData.type_hindi,
            amount: formData.amount,
            icon: formData.icon,
            is_active: formData.is_active,
            sort_order: formData.sort_order,
            login_payment_amount: formData.login_payment_amount,
          },
        ]);

        if (error) throw error;
        alert("Created successfully!");
      }

      resetForm();
      fetchLoanOptions();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving");
    }
  };

  const handleEdit = (option: LoanOption) => {
    setFormData({
      type: option.type,
      type_hindi: option.type_hindi,
      amount: option.amount,
      icon: option.icon,
      is_active: option.is_active,
      sort_order: option.sort_order,
      login_payment_amount: option.login_payment_amount || "",
    });
    setEditingId(option.id || null);
    setQrCodeUrl(option.payment_qr_url || "");
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this option?")) return;

    try {
      const { error } = await supabase
        .from("loan_options")
        .delete()
        .eq("id", id);
      if (error) throw error;
      alert("Deleted successfully!");
      fetchLoanOptions();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting");
    }
  };

  const resetForm = () => {
    setFormData({
      type: "Personal Loan",
      type_hindi: "व्यक्तिगत ऋण",
      amount: "",
      icon: "💰",
      is_active: true,
      sort_order: 1,
      login_payment_amount: "",
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleInputChange = (
    field: keyof LoanOption,
    value: string | boolean | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#03A9F4] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#A3AED0] text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-3 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#2B3674]">
              Loan Options
            </h1>
            <p className="text-xs text-[#A3AED0]">
              {loanOptions.length} options configured
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#03A9F4] text-white px-3 py-1.5 rounded-md hover:bg-[#0288D1] flex items-center gap-1.5 text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Option
          </button>
        </div>

        {/* QR Code Upload - Minimal Card */}
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100/50">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {qrCodeUrl ? (
                <div className="w-14 h-14 rounded-md border border-gray-100 overflow-hidden bg-gray-50">
                  <img
                    src={qrCodeUrl}
                    alt="QR"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-md border border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                  <Image className="w-5 h-5 text-[#A3AED0]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2B3674]">
                Payment QR Code
              </p>
              <p className="text-xs text-[#A3AED0] truncate">
                Used across all loan options
              </p>
            </div>
            <label className="flex-shrink-0">
              <input
                type="file"
                accept="image/*"
                onChange={handleQrUpload}
                disabled={uploadingQr}
                className="hidden"
              />
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-200 ${
                  uploadingQr
                    ? "bg-gray-100 text-gray-400"
                    : "bg-[#F4F7FE] text-[#03A9F4] hover:bg-[#E3F2FD]"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                {uploadingQr ? "Uploading..." : "Upload"}
              </span>
            </label>
          </div>
        </div>

        {/* Add/Edit Form - Slide Down Modal */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100/50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-[#03A9F4]/5 to-transparent">
              <h2 className="text-sm font-semibold text-[#2B3674]">
                {editingId ? "Edit Option" : "New Option"}
              </h2>
              <button
                onClick={resetForm}
                className="text-[#A3AED0] hover:text-[#2B3674] p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-medium text-[#A3AED0] uppercase tracking-wider mb-1">
                    Type (English)
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] text-[#2B3674] transition-all"
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-medium text-[#A3AED0] uppercase tracking-wider mb-1">
                    Type (Hindi)
                  </label>
                  <input
                    type="text"
                    value={formData.type_hindi}
                    onChange={(e) =>
                      handleInputChange("type_hindi", e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] text-[#2B3674] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#A3AED0] uppercase tracking-wider mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    placeholder="₹1,000"
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] text-[#2B3674] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#A3AED0] uppercase tracking-wider mb-1">
                    Login Payment
                  </label>
                  <input
                    type="text"
                    value={formData.login_payment_amount || ""}
                    onChange={(e) =>
                      handleInputChange("login_payment_amount", e.target.value)
                    }
                    placeholder="₹500"
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] text-[#2B3674] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#A3AED0] uppercase tracking-wider mb-1">
                    Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => handleInputChange("icon", e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] text-[#2B3674] bg-white transition-all"
                  >
                    {availableIcons.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#A3AED0] uppercase tracking-wider mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      handleInputChange("sort_order", parseInt(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] text-[#2B3674] transition-all"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        handleInputChange("is_active", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-200 rounded-full peer-checked:bg-[#03A9F4] transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                  </div>
                  <span className="text-xs font-medium text-[#2B3674]">
                    Active
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 text-xs font-medium text-[#A3AED0] hover:text-[#2B3674] hover:bg-gray-100 rounded-md transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#03A9F4] text-white px-4 py-1.5 rounded-md hover:bg-[#0288D1] flex items-center gap-1.5 text-xs font-medium transition-all duration-200 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {editingId ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Loan Options Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
          {loanOptions.map((option, index) => (
            <div
              key={option.id}
              className="group bg-white rounded-lg shadow-sm p-3 border border-gray-100/50 hover:shadow-md hover:border-[#03A9F4]/20 transition-all duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#F4F7FE] to-[#E3F2FD] flex items-center justify-center text-base">
                  {option.icon}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(option)}
                    className="p-1 text-[#03A9F4] hover:bg-[#F4F7FE] rounded transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(option.id!)}
                    className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <p className="text-sm font-semibold text-[#2B3674] leading-tight">
                {option.amount}
              </p>
              <p className="text-[10px] text-[#A3AED0] mt-0.5 truncate">
                {option.type}
              </p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <span
                  className={`inline-flex items-center h-4 px-1.5 rounded text-[9px] font-semibold ${
                    option.is_active
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {option.is_active ? "Active" : "Off"}
                </span>
                <span className="text-[9px] text-[#A3AED0]">
                  #{option.sort_order}
                </span>
              </div>
            </div>
          ))}

          {loanOptions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
              <div className="w-10 h-10 rounded-full bg-[#F4F7FE] flex items-center justify-center mb-3">
                <Plus className="w-5 h-5 text-[#A3AED0]" />
              </div>
              <p className="text-sm font-medium text-[#2B3674]">
                No options yet
              </p>
              <p className="text-xs text-[#A3AED0] mt-0.5">
                Create your first loan option
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-3 text-xs font-medium text-[#03A9F4] hover:underline"
              >
                + Add Option
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoanManager;
