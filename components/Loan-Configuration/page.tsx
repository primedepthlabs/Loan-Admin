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
  interest_rate: number;
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
  const [interestRate, setInterestRate] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"weekly" | "monthly">(
    "weekly"
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
        setInterestRate(data.interest_rate.toString());
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
    value: any
  ) => {
    const newTenures = [...tenureOptions];
    newTenures[index] = { ...newTenures[index], [field]: value };

    // Auto-update label when value or unit changes
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
    if (!interestRate || parseFloat(interestRate) <= 0) {
      setError("Please enter a valid interest rate (greater than 0)");
      return false;
    }

    if (parseFloat(interestRate) > 100) {
      setError("Interest rate cannot exceed 100%");
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
        interest_rate: parseFloat(interestRate),
        tenure_options: tenureOptions,
        payment_type: paymentType,
        updated_at: new Date().toISOString(),
      };

      if (currentSettings) {
        // Update existing
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
        // Insert new
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
      <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center space-x-2 max-w-md animate-slide-in">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
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

      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-yellow-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Loan Configuration
              </h1>
            </div>
            <p className="text-gray-600">
              Configure interest rates, tenure options, and payment types for
              all loans
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Interest Rate Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="inline w-4 h-4 mr-1" />
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Enter interest rate (e.g., 12.00)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Annual interest rate applied to all loans (e.g., 12% = 12.00)
              </p>
            </div>

            {/* Payment Type Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Calendar className="inline w-4 h-4 mr-1" />
                Payment Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    value="weekly"
                    checked={paymentType === "weekly"}
                    onChange={(e) =>
                      setPaymentType(e.target.value as "weekly" | "monthly")
                    }
                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="ml-2 text-gray-700">Weekly Payments</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    value="monthly"
                    checked={paymentType === "monthly"}
                    onChange={(e) =>
                      setPaymentType(e.target.value as "weekly" | "monthly")
                    }
                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="ml-2 text-gray-700">Monthly Payments</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select how often users will make loan payments
              </p>
            </div>

            {/* Tenure Options Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Tenure Options
                </label>
                <button
                  onClick={handleAddTenure}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
              </div>

              <div className="space-y-4">
                {tenureOptions.map((tenure, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Value */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Value
                          </label>
                          <input
                            type="number"
                            value={tenure.value}
                            onChange={(e) =>
                              handleUpdateTenure(
                                index,
                                "value",
                                parseInt(e.target.value) || 0
                              )
                            }
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            placeholder="1"
                          />
                        </div>

                        {/* Unit */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Unit
                          </label>
                          <select
                            value={tenure.unit}
                            onChange={(e) =>
                              handleUpdateTenure(index, "unit", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          >
                            <option value="week">Week(s)</option>
                            <option value="month">Month(s)</option>
                            <option value="year">Year(s)</option>
                          </select>
                        </div>

                        {/* Label */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={tenure.label}
                            onChange={(e) =>
                              handleUpdateTenure(index, "label", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            placeholder="1 Week"
                          />
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleRemoveTenure(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-5"
                        title="Remove tenure option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Add multiple tenure options for users to choose from (e.g., 1
                Week, 2 Weeks, 1 Month)
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isLoading || !interestRate}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 flex items-center ${
                  isLoading || !interestRate
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600 shadow-md hover:shadow-lg"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>

            {/* Preview Section */}
            {currentSettings && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Current Configuration Preview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="ml-2 font-semibold text-gray-800">
                      {currentSettings.interest_rate}% per annum
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Type:</span>
                    <span className="ml-2 font-semibold text-gray-800 capitalize">
                      {currentSettings.payment_type}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-600">Tenure Options:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentSettings.tenure_options.map((option, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium"
                        >
                          {option.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLoanSettings;
