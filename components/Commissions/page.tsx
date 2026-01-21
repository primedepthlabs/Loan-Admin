"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
  Percent,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface SuccessNotificationProps {
  message: string;
  onClose: () => void;
}

const AdminCommissionSettings: React.FC = () => {
  const [singlePercentage, setSinglePercentage] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchCommissionSettings();
  }, []);

  const fetchCommissionSettings = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from("commission_rules")
        .select("percentage")
        .eq("level", 0) // Get global percentage
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching settings:", error);
      }

      if (data) {
        setSinglePercentage(data.percentage || 10);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (singlePercentage <= 0 || singlePercentage > 100) {
      setError("Percentage must be between 0 and 100");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Delete all existing rules
      await supabase.from("commission_rules").delete().gte("level", 0);

      // Insert single global rule at level 0 (represents all levels)
      const { error: insertError } = await supabase
        .from("commission_rules")
        .insert({
          level: 0, // Special: 0 means "global percentage for all levels"
          percentage: singlePercentage,
        });

      if (insertError) {
        setError("Failed to save: " + insertError.message);
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Commission percentage saved successfully!");
      setShowSuccess(true);
    } catch (error) {
      console.error("Error saving:", error);
      setError("An error occurred while saving");
    } finally {
      setIsLoading(false);
    }
  };

  const SuccessNotification: React.FC<SuccessNotificationProps> = ({
    message,
    onClose,
  }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <div className="fixed top-4 right-4 bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-sm animate-in slide-in-from-top-2 duration-200">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-auto text-white/80 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F7FE]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#03A9F4] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#A3AED0] text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showSuccess && (
        <SuccessNotification
          message={successMessage}
          onClose={() => setShowSuccess(false)}
        />
      )}

      <div className="min-h-screen bg-[#F4F7FE] p-3 sm:p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[#2B3674]">
                Commission Settings
              </h1>
              <p className="text-xs text-[#A3AED0]">
                Configure commission percentage for all levels
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600">
              <Percent className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{singlePercentage}%</span>
            </div>
          </div>

          {/* Error Message */}
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

          {/* Main Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100/50 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#F4F7FE] to-[#E3F2FD] flex items-center justify-center">
                  <Percent className="w-3.5 h-3.5 text-[#03A9F4]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2B3674]">
                    Commission Percentage
                  </p>
                  <p className="text-[10px] text-[#A3AED0]">
                    Same percentage applied to all referral levels
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={singlePercentage}
                  onChange={(e) =>
                    setSinglePercentage(parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#03A9F4] focus:border-[#03A9F4] font-semibold text-[#2B3674] transition-all"
                  placeholder="10.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3AED0] text-lg font-medium">
                  %
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] text-[#A3AED0]">
                Changes will apply to all new commissions
              </p>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className={`px-4 py-1.5 rounded-md text-xs font-medium text-white transition-all duration-200 flex items-center gap-1.5 shadow-sm ${
                  isLoading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#03A9F4] hover:bg-[#0288D1] hover:shadow-md"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminCommissionSettings;
