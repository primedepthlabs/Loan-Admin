"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";

interface LoanOption {
  id?: string;
  type: string;
  type_hindi: string;
  amount: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

const AdminLoanManager: React.FC = () => {
  const [loanOptions, setLoanOptions] = useState<LoanOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<LoanOption>({
    type: "Personal Loan",
    type_hindi: "व्यक्तिगत ऋण",
    amount: "",
    icon: "💰",
    is_active: true,
    sort_order: 1,
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
    } catch (error) {
      console.error("Error fetching loan options:", error);
      alert("Error fetching loan options");
    } finally {
      setIsLoading(false);
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
    });
    setEditingId(option.id || null);
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
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleInputChange = (
    field: keyof LoanOption,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-2">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              Loan Options
            </h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-700 flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base sm:text-lg font-semibold">
                {editingId ? "Edit" : "Add New"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type (English)
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type (Hindi)
                  </label>
                  <input
                    type="text"
                    value={formData.type_hindi}
                    onChange={(e) =>
                      handleInputChange("type_hindi", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    placeholder="₹1,000"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => handleInputChange("icon", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {availableIcons.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      handleInputChange("sort_order", parseInt(e.target.value))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    min="1"
                    required
                  />
                </div>

                <div className="flex items-center pt-4">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      handleInputChange("is_active", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 text-xs font-medium text-gray-700"
                  >
                    Active
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 cursor-pointer rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                {editingId ? "Update" : "Create"}
              </button>
            </form>
          </div>
        )}

        {/* Loan Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {loanOptions.map((option) => (
            <div
              key={option.id}
              className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">{option.icon}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(option)}
                    className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer rounded hover:bg-blue-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(option.id!)}
                    className="text-red-600 hover:text-red-800 p-1 cursor-pointer rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-semibold text-gray-800 mb-1">
                {option.amount}
              </h3>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {option.type}
              </p>

              <div className="flex items-center justify-between text-xs">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full ${
                    option.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {option.is_active ? "Active" : "Inactive"}
                </span>
                <span className="text-gray-500">#{option.sort_order}</span>
              </div>
            </div>
          ))}

          {loanOptions.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-base">No options found</p>
              <p className="text-xs mt-1">Click "Add New" to create one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoanManager;
