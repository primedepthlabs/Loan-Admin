"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  CheckCircle,
  X,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  Settings,
  Percent,
  Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface TenureOption {
  value: number;
  label: string;
  unit: string;
}

interface LoanConfiguration {
  id: string;
  disbursement_interest: number;
  repayment_interest: number;
  tenure_options: TenureOption[];
  payment_type: "weekly" | "monthly";
  created_at: string;
  updated_at: string;
}

interface SuccessNotificationProps {
  message: string;
  onClose: () => void;
}

const AdminLoanSettings: React.FC = () => {
  const [disbursementInterest, setDisbursementInterest] = useState<string>("");
  const [repaymentInterest, setRepaymentInterest] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"weekly" | "monthly">(
    "weekly",
  );
  const [tenureOptions, setTenureOptions] = useState<TenureOption[]>([
    { value: 1, label: "1 Week", unit: "week" },
  ]);
  const [currentSettings, setCurrentSettings] =
    useState<LoanConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from("loan_configuration")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching loan configuration:", error);
        setError("Failed to fetch loan configuration");
        return;
      }

      if (data) {
        setCurrentSettings(data);
        setDisbursementInterest(data.disbursement_interest.toString());
        setRepaymentInterest(data.repayment_interest.toString());
        setPaymentType(data.payment_type);
        setTenureOptions(data.tenure_options);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred while fetching settings");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddTenure = () => {
    const newTenure: TenureOption = {
      value: 1,
      label: "1 Week",
      unit: "week",
    };
    setTenureOptions([...tenureOptions, newTenure]);
  };

  const handleRemoveTenure = (index: number) => {
    if (tenureOptions.length === 1) {
      setError("You must have at least one tenure option");
      return;
    }
    setTenureOptions(tenureOptions.filter((_, i) => i !== index));
    setError("");
  };

  const handleUpdateTenure = (
    index: number,
    field: keyof TenureOption,
    value: any,
  ) => {
    const newTenures = [...tenureOptions];
    newTenures[index] = { ...newTenures[index], [field]: value };

    if (field === "value" || field === "unit") {
      const tenureValue = field === "value" ? value : newTenures[index].value;
      const tenureUnit = field === "unit" ? value : newTenures[index].unit;
      newTenures[index].label = `${tenureValue} ${
        tenureValue === 1 ? tenureUnit.replace(/s$/, "") : tenureUnit
      }`;
    }

    setTenureOptions(newTenures);
  };

  const validateSettings = (): boolean => {
    if (!disbursementInterest || parseFloat(disbursementInterest) < 0) {
      setError("Please enter a valid disbursement interest (0 or greater)");
      return false;
    }

    if (parseFloat(disbursementInterest) > 100) {
      setError("Disbursement interest cannot exceed 100%");
      return false;
    }

    if (!repaymentInterest || parseFloat(repaymentInterest) < 0) {
      setError("Please enter a valid repayment interest (0 or greater)");
      return false;
    }

    if (parseFloat(repaymentInterest) > 500) {
      setError("Repayment interest seems too high (max 500%)");
      return false;
    }

    if (tenureOptions.length === 0) {
      setError("Please add at least one tenure option");
      return false;
    }

    for (let i = 0; i < tenureOptions.length; i++) {
      if (tenureOptions[i].value <= 0) {
        setError(`Tenure option ${i + 1} must have a value greater than 0`);
        return false;
      }
      if (!tenureOptions[i].label.trim()) {
        setError(`Tenure option ${i + 1} must have a label`);
        return false;
      }
      if (!tenureOptions[i].unit.trim()) {
        setError(`Tenure option ${i + 1} must have a unit`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const configData = {
        disbursement_interest: parseFloat(disbursementInterest),
        repayment_interest: parseFloat(repaymentInterest),
        tenure_options: tenureOptions,
        payment_type: paymentType,
        updated_at: new Date().toISOString(),
      };

      if (currentSettings) {
        const { error: updateError } = await supabase
          .from("loan_configuration")
          .update(configData)
          .eq("id", currentSettings.id);

        if (updateError) {
          setError("Failed to update configuration: " + updateError.message);
          setIsLoading(false);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from("loan_configuration")
          .insert([configData]);

        if (insertError) {
          setError("Failed to save configuration: " + insertError.message);
          setIsLoading(false);
          return;
        }
      }

      setSuccessMessage("Loan configuration saved successfully!");
      setShowSuccess(true);
      await fetchCurrentSettings();
    } catch (error) {
      console.error("Error saving configuration:", error);
      setError("An error occurred while saving configuration");
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

  const calculateExample = () => {
    const loanAmount = 10000;
    const disbInterest = parseFloat(disbursementInterest) || 0;
    const repayInterest = parseFloat(repaymentInterest) || 0;

    const disbursementDeduction = Math.round(
      loanAmount * (disbInterest / 100),
    );
    const amountReceived = loanAmount - disbursementDeduction;

    const repaymentAddition = Math.round(loanAmount * (repayInterest / 100));
    const totalRepayable = loanAmount + repaymentAddition;

    const totalInterest = disbursementDeduction + repaymentAddition;

    return {
      amountReceived,
      totalRepayable,
      totalInterest,
      disbursementDeduction,
      repaymentAddition,
    };
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

  const example = calculateExample();

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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#03A9F4] to-[#0288D1] flex items-center justify-center shadow-sm">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#2B3674]">
                  Loan Configuration
                </h1>
                <p className="text-xs text-[#A3AED0]">
                  Interest rates, tenure & payment settings
                </p>
              </div>
            </div>
            {currentSettings && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Configured</span>
              </div>
            )}
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
            {/* Interest Rates Section */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#F4F7FE] to-[#E3F2FD] flex items-center justify-center">
                  <Percent className="w-3 h-3 text-[#03A9F4]" />
                </div>
                <p className="text-sm font-medium text-[#2B3674]">
                  Interest Rates
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-[#A3AED0] uppercase tracking-wider mb-1">
                    Disbursement Interest (%)
                  </label>
                  <input
                    type="number"
                    value={disbursementInterest}
                    onChange={(e) => setDisbursementInterest(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] font-medium text-[#2B3674] transition-all"
                    placeholder="5.00"
                  />
                  <p className="text-[9px] text-[#A3AED0] mt-1">
                    Deducted from loan amount
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[#A3AED0] uppercase tracking-wider mb-1">
                    Repayment Interest (%)
                  </label>
                  <input
                    type="number"
                    value={repaymentInterest}
                    onChange={(e) => setRepaymentInterest(e.target.value)}
                    min="0"
                    max="500"
                    step="0.01"
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] font-medium text-[#2B3674] transition-all"
                    placeholder="10.00"
                  />
                  <p className="text-[9px] text-[#A3AED0] mt-1">
                    Added to repayment amount
                  </p>
                </div>
              </div>
            </div>

            {/* Example Calculation */}
            {disbursementInterest && repaymentInterest && (
              <div className="px-4 py-3 bg-gradient-to-r from-[#F4F7FE] to-transparent border-b border-gray-100">
                <p className="text-[10px] font-medium text-[#A3AED0] uppercase tracking-wider mb-2">
                  Example: ₹10,000 Loan
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-white rounded-md border border-gray-100">
                    <p className="text-[9px] text-[#A3AED0] mb-0.5">
                      User Receives
                    </p>
                    <p className="text-sm font-semibold text-emerald-600">
                      ₹{example.amountReceived.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-md border border-gray-100">
                    <p className="text-[9px] text-[#A3AED0] mb-0.5">
                      User Repays
                    </p>
                    <p className="text-sm font-semibold text-[#2B3674]">
                      ₹{example.totalRepayable.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-md border border-gray-100">
                    <p className="text-[9px] text-[#A3AED0] mb-0.5">
                      Total Interest
                    </p>
                    <p className="text-sm font-semibold text-orange-500">
                      ₹{example.totalInterest.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Type Section */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#F4F7FE] to-[#E3F2FD] flex items-center justify-center">
                  <Calendar className="w-3 h-3 text-[#03A9F4]" />
                </div>
                <p className="text-sm font-medium text-[#2B3674]">
                  Payment Type
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType("weekly")}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    paymentType === "weekly"
                      ? "bg-[#03A9F4] text-white shadow-sm"
                      : "bg-gray-100 text-[#A3AED0] hover:bg-gray-200"
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("monthly")}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    paymentType === "monthly"
                      ? "bg-[#03A9F4] text-white shadow-sm"
                      : "bg-gray-100 text-[#A3AED0] hover:bg-gray-200"
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {/* Tenure Options Section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[#2B3674]">
                  Tenure Options
                </p>
                <button
                  onClick={handleAddTenure}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#03A9F4] bg-[#F4F7FE] rounded-md hover:bg-[#E3F2FD] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {tenureOptions.map((tenure, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <input
                      type="number"
                      value={tenure.value}
                      onChange={(e) =>
                        handleUpdateTenure(
                          index,
                          "value",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      min="1"
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] text-[#2B3674]"
                      placeholder="1"
                    />
                    <select
                      value={tenure.unit}
                      onChange={(e) =>
                        handleUpdateTenure(index, "unit", e.target.value)
                      }
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] text-[#2B3674] bg-white"
                    >
                      <option value="week">Week(s)</option>
                      <option value="month">Month(s)</option>
                      <option value="year">Year(s)</option>
                    </select>
                    <input
                      type="text"
                      value={tenure.label}
                      onChange={(e) =>
                        handleUpdateTenure(index, "label", e.target.value)
                      }
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] text-[#2B3674]"
                      placeholder="Label"
                    />
                    <button
                      onClick={() => handleRemoveTenure(index)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] text-[#A3AED0]">
                {currentSettings
                  ? "Configuration saved"
                  : "No configuration saved yet"}
              </p>
              <button
                onClick={handleSave}
                disabled={
                  isLoading || !disbursementInterest || !repaymentInterest
                }
                className={`px-4 py-1.5 rounded-md text-xs font-medium text-white transition-all duration-200 flex items-center gap-1.5 shadow-sm ${
                  isLoading || !disbursementInterest || !repaymentInterest
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
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Current Config Preview */}
          {currentSettings && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100/50 p-4">
              <p className="text-xs font-medium text-[#2B3674] mb-3">
                Current Configuration
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-2 bg-gray-50 rounded-md">
                  <p className="text-[9px] text-[#A3AED0] uppercase mb-0.5">
                    Disbursement
                  </p>
                  <p className="text-sm font-semibold text-[#2B3674]">
                    {currentSettings.disbursement_interest}%
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-md">
                  <p className="text-[9px] text-[#A3AED0] uppercase mb-0.5">
                    Repayment
                  </p>
                  <p className="text-sm font-semibold text-[#2B3674]">
                    {currentSettings.repayment_interest}%
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-md">
                  <p className="text-[9px] text-[#A3AED0] uppercase mb-0.5">
                    Payment
                  </p>
                  <p className="text-sm font-semibold text-[#2B3674] capitalize">
                    {currentSettings.payment_type}
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-md">
                  <p className="text-[9px] text-[#A3AED0] uppercase mb-0.5">
                    Tenures
                  </p>
                  <p className="text-sm font-semibold text-[#2B3674]">
                    {currentSettings.tenure_options.length}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {currentSettings.tenure_options.map((option, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-[#03A9F4]/10 text-[#03A9F4] text-[10px] font-medium rounded"
                  >
                    {option.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminLoanSettings;
