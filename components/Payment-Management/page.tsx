"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Save,
  CheckCircle,
  X,
  Trash2,
  IndianRupee,
  QrCode,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface PaymentSettings {
  id: string;
  qr_code_url: string;
  payment_amount: number;
}

interface SuccessNotificationProps {
  message: string;
  onClose: () => void;
}

const AdminPaymentSettings: React.FC = () => {
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [currentSettings, setCurrentSettings] =
    useState<PaymentSettings | null>(null);
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
        .from("payment_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching settings:", error);
        return;
      }

      if (data) {
        setCurrentSettings(data);
        setPaymentAmount(data.payment_amount.toString());
        setQrCodePreview(data.qr_code_url);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPG, JPEG, PNG)");
      return;
    }

    if (file.size > maxSize) {
      setError("File must be less than 5MB");
      return;
    }

    setQrCodeFile(file);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrCodePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let qrCodeUrl = currentSettings?.qr_code_url || "";

      // Upload new QR code if selected
      if (qrCodeFile) {
        const fileExtension = qrCodeFile.name.split(".").pop();
        const fileName = `payment-qr-${Date.now()}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("qr-codes")
          .upload(fileName, qrCodeFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          setError("Failed to upload QR code: " + uploadError.message);
          setIsLoading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("qr-codes")
          .getPublicUrl(fileName);

        qrCodeUrl = publicUrlData.publicUrl;

        // Delete old QR code if exists
        if (currentSettings?.qr_code_url) {
          const oldFileName = currentSettings.qr_code_url.split("/").pop();
          if (oldFileName) {
            await supabase.storage.from("qr-codes").remove([oldFileName]);
          }
        }
      }

      // Update or insert payment settings
      if (currentSettings) {
        // Update existing
        const { error: updateError } = await supabase
          .from("payment_settings")
          .update({
            qr_code_url: qrCodeUrl,
            payment_amount: parseFloat(paymentAmount),
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentSettings.id);

        if (updateError) {
          setError("Failed to update settings: " + updateError.message);
          setIsLoading(false);
          return;
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("payment_settings")
          .insert([
            {
              qr_code_url: qrCodeUrl,
              payment_amount: parseFloat(paymentAmount),
            },
          ]);

        if (insertError) {
          setError("Failed to save settings: " + insertError.message);
          setIsLoading(false);
          return;
        }
      }

      setSuccessMessage("Payment settings saved successfully!");
      setShowSuccess(true);
      setQrCodeFile(null);
      await fetchCurrentSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("An error occurred while saving settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveQrCode = () => {
    setQrCodeFile(null);
    if (currentSettings) {
      setQrCodePreview(currentSettings.qr_code_url);
    } else {
      setQrCodePreview("");
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Payment Management
            </h1>
            <p className="text-gray-600">
              Configure payment QR code and amount for user registrations
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

            {/* Payment Amount Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <IndianRupee className="inline w-4 h-4 mr-1" />
                Payment Amount (₹)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min="0"
                step="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Enter amount (e.g., 500)"
              />
              <p className="text-xs text-gray-500 mt-1">
                This amount will be displayed to users during registration
              </p>
            </div>

            {/* QR Code Upload Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <QrCode className="inline w-4 h-4 mr-1" />
                Payment QR Code
              </label>

              {/* Current/Preview QR Code */}
              {qrCodePreview && (
                <div className="mb-4 relative">
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 inline-block">
                    <img
                      src={qrCodePreview}
                      alt="Payment QR Code"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  {qrCodeFile && (
                    <button
                      onClick={handleRemoveQrCode}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      title="Remove new QR code"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {qrCodeFile
                      ? "New QR code (not saved yet)"
                      : "Current QR code"}
                  </p>
                </div>
              )}

              {/* Upload Button */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                <Upload className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleQrCodeChange}
                  className="hidden"
                  id="qrCodeUpload"
                />
                <label
                  htmlFor="qrCodeUpload"
                  className="cursor-pointer text-yellow-600 hover:text-yellow-500 font-medium"
                >
                  {qrCodePreview ? "Change QR Code" : "Click to upload QR Code"}
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, JPEG, PNG up to 5MB
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isLoading || !paymentAmount}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 flex items-center ${
                  isLoading || !paymentAmount
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

export default AdminPaymentSettings;
