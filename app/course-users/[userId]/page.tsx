"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface Feature {
  id: string;
  feature_key: string;
  display_name: string;
  description: string;
  icon: string;
  is_active: boolean;
}

interface UserDetails {
  name: string;
  email: string;
  plan_name: string;
  payment_amount: number;
}

export default function ManageUserAccess() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [grantedFeatures, setGrantedFeatures] = useState<Feature[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);
  const [draggedFeature, setDraggedFeature] = useState<Feature | null>(null);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching data for user:", userId);

      const { data: paymentData, error: paymentError } = await supabase
        .from("course_payments")
        .select("*")
        .eq("user_id", userId)
        .eq("payment_status", "verified")
        .order("verified_at", { ascending: false })
        .limit(1)
        .single();

      console.log("Payment data:", paymentData, "Error:", paymentError);

      if (paymentError) {
        setError("Payment fetch error: " + paymentError.message);
        setLoading(false);
        return;
      }

      if (!paymentData) {
        setError("No verified payment found for this user");
        setLoading(false);
        return;
      }

      // Fetch user details
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("name, email")
        .eq("auth_user_id", userId)
        .single();

      console.log("User data:", userData, "Error:", userError);

      // Fetch plan details
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .select("plan_name")
        .eq("id", paymentData.plan_id)
        .single();

      console.log("Plan data:", planData, "Error:", planError);

      setUserDetails({
        name: userData?.name || "Unknown",
        email: userData?.email || "N/A",
        plan_name: planData?.plan_name || "Unknown Plan",
        payment_amount: paymentData.payment_amount,
      });

      // Fetch all features
      const { data: featuresData, error: featuresError } = await supabase
        .from("features")
        .select("*")
        .eq("is_active", true);

      console.log("Features data:", featuresData, "Error:", featuresError);

      if (featuresError) {
        setError("Features fetch error: " + featuresError.message);
        setLoading(false);
        return;
      }

      setAllFeatures(featuresData || []);

      // Fetch user's current granted features
      const { data: grantedData, error: grantedError } = await supabase
        .from("user_feature_access")
        .select("feature_id")
        .eq("user_id", userId);

      console.log("Granted data:", grantedData, "Error:", grantedError);

      const grantedIds = new Set(grantedData?.map((g) => g.feature_id) || []);

      // Split features into granted and available
      const granted = (featuresData || []).filter((f) => grantedIds.has(f.id));
      const available = (featuresData || []).filter(
        (f) => !grantedIds.has(f.id)
      );

      setGrantedFeatures(granted);
      setAvailableFeatures(available);

      console.log(
        "Setup complete - Available:",
        available.length,
        "Granted:",
        granted.length
      );
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  // Drag handlers for Available → Granted
  const handleDragStartAvailable = (feature: Feature) => {
    setDraggedFeature(feature);
  };

  const handleDragOverGranted = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropGranted = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedFeature) {
      setAvailableFeatures((prev) =>
        prev.filter((f) => f.id !== draggedFeature.id)
      );
      setGrantedFeatures((prev) => [...prev, draggedFeature]);
      setDraggedFeature(null);
    }
  };

  // Drag handlers for Granted → Available
  const handleDragStartGranted = (feature: Feature) => {
    setDraggedFeature(feature);
  };

  const handleDragOverAvailable = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedFeature) {
      setGrantedFeatures((prev) =>
        prev.filter((f) => f.id !== draggedFeature.id)
      );
      setAvailableFeatures((prev) => [...prev, draggedFeature]);
      setDraggedFeature(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const {
        data: { user: adminUser },
      } = await supabase.auth.getUser();

      await supabase.from("user_feature_access").delete().eq("user_id", userId);

      if (grantedFeatures.length > 0) {
        const accessRecords = grantedFeatures.map((feature) => ({
          user_id: userId,
          feature_id: feature.id,
          granted_by: adminUser?.id || null,
          granted_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("user_feature_access")
          .insert(accessRecords);

        if (error) throw error;
      }

      alert("Access updated successfully!");
      router.push("/course-users");
    } catch (error) {
      console.error("Error saving access:", error);
      alert("Failed to save access");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </button>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Manage Access - {userDetails?.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
              <span>{userDetails?.email}</span>
              <span>•</span>
              <span>{userDetails?.plan_name}</span>
              <span>•</span>
              <span className="font-medium">
                ₹{userDetails?.payment_amount}
              </span>
            </div>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Available Features */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Available Features ({availableFeatures.length})
            </h2>
            <div
              className="space-y-2 min-h-[400px]"
              onDragOver={handleDragOverAvailable}
              onDrop={handleDropAvailable}
            >
              {availableFeatures.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">
                  All features granted
                </p>
              ) : (
                availableFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    draggable
                    onDragStart={() => handleDragStartAvailable(feature)}
                    className="bg-white border border-gray-200 rounded-lg p-3 cursor-move hover:border-gray-400 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{feature.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {feature.display_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Granted Features */}
          <div className="border-2 border-dashed border-gray-900 rounded-lg p-4 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Granted Features ✓ ({grantedFeatures.length})
            </h2>
            <div
              className="space-y-2 min-h-[400px]"
              onDragOver={handleDragOverGranted}
              onDrop={handleDropGranted}
            >
              {grantedFeatures.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">
                  Drag features here to grant access
                </p>
              ) : (
                grantedFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    draggable
                    onDragStart={() => handleDragStartGranted(feature)}
                    className="bg-gray-900 text-white rounded-lg p-3 cursor-move hover:bg-gray-800 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{feature.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {feature.display_name}
                        </p>
                        <p className="text-xs opacity-75">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600">
            💡 <strong>How to use:</strong> Drag features from the left to the
            right to grant access. Drag from right to left to revoke access.
            Click "Save Changes" when done.
          </p>
        </div>
      </div>
    </div>
  );
}
