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
  Image,
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
    const maxSize = 5 * 1024 * 1024;

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

        if (currentSettings?.qr_code_url) {
          const oldFileName = currentSettings.qr_code_url.split("/").pop();
          if (oldFileName) {
            await supabase.storage.from("qr-codes").remove([oldFileName]);
          }
        }
      }

      if (currentSettings) {
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
              <h1 className="text-lg font-semibold text-[#2B3674]">Payment Settings</h1>
              <p className="text-xs text-[#A3AED0]">Configure QR code and amount for registrations</p>
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
            {/* Payment Amount Section */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#F4F7FE] to-[#E3F2FD] flex items-center justify-center">
                  <IndianRupee className="w-3.5 h-3.5 text-[#03A9F4]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2B3674]">Payment Amount</p>
                  <p className="text-[10px] text-[#A3AED0]">Amount shown to users during registration</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3AED0] text-sm">₹</span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="0"
                  step="1"
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#03A9F4] focus:border-[#03A9F4] font-medium text-[#2B3674] transition-all"
                  placeholder="500"
                />
              </div>
            </div>

            {/* QR Code Section */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#F4F7FE] to-[#E3F2FD] flex items-center justify-center">
                  <QrCode className="w-3.5 h-3.5 text-[#03A9F4]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2B3674]">Payment QR Code</p>
                  <p className="text-[10px] text-[#A3AED0]">Upload your payment QR code image</p>
                </div>
              </div>

              <div className="flex gap-4">
                {/* QR Preview */}
                <div className="flex-shrink-0">
                  {qrCodePreview ? (
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <img
                          src={qrCodePreview}
                          alt="Payment QR"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      {qrCodeFile && (
                        <button
                          onClick={handleRemoveQrCode}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <p className="text-[9px] text-center text-[#A3AED0] mt-1.5 font-medium">
                        {qrCodeFile ? "New (unsaved)" : "Current"}
                      </p>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50">
                      <Image className="w-6 h-6 text-[#A3AED0] mb-1" />
                      <p className="text-[9px] text-[#A3AED0]">No QR</p>
                    </div>
                  )}
                </div>

                {/* Upload Area */}
                <div className="flex-1">
                  <label
                    htmlFor="qrCodeUpload"
                    className="flex flex-col items-center justify-center h-28 border border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#03A9F4] hover:bg-[#F4F7FE]/50 transition-all group"
                  >
                    <Upload className="w-5 h-5 text-[#A3AED0] mb-1.5 group-hover:text-[#03A9F4] transition-colors" />
                    <span className="text-xs font-medium text-[#03A9F4]">
                      {qrCodePreview ? "Change QR" : "Upload QR"}
                    </span>
                    <span className="text-[9px] text-[#A3AED0] mt-0.5">
                      JPG, PNG up to 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleQrCodeChange}
                      className="hidden"
                      id="qrCodeUpload"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] text-[#A3AED0]">
                {currentSettings ? "Last updated: Settings saved" : "No settings saved yet"}
              </p>
              <button
                onClick={handleSave}
                disabled={isLoading || !paymentAmount}
                className={`px-4 py-1.5 rounded-md text-xs font-medium text-white transition-all duration-200 flex items-center gap-1.5 shadow-sm ${
                  isLoading || !paymentAmount
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

          {/* Info Card */}
          <div className="bg-gradient-to-r from-[#03A9F4]/5 to-transparent rounded-lg p-3 border border-[#03A9F4]/10">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-[#03A9F4] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-[#2B3674]">How it works</p>
                <p className="text-[10px] text-[#A3AED0] mt-0.5 leading-relaxed">
                  The payment amount and QR code you configure here will be displayed to users during their registration process. Make sure the QR code is clear and scannable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPaymentSettings;
