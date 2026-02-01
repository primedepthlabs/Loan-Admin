"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
} from "lucide-react";

interface PlanFeature {
  id: string;
  text: string;
}

interface Plan {
  id: string;
  plan_name: string;
  plan_name_hindi: string | null;
  amount: number;
  cashback_percentage: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

const PlanCreation = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form fields
  const [planName, setPlanName] = useState("");
  const [planNameHindi, setPlanNameHindi] = useState("");
  const [amount, setAmount] = useState("");
  const [features, setFeatures] = useState<PlanFeature[]>([
    { id: "1", text: "" },
  ]);
  const [cashbackPercentage, setCashbackPercentage] = useState("20");
  const addFeature = () => {
    setFeatures([...features, { id: Date.now().toString(), text: "" }]);
  };

  const removeFeature = (id: string) => {
    if (features.length > 1) {
      setFeatures(features.filter((f) => f.id !== id));
    }
  };

  const updateFeature = (id: string, text: string) => {
    setFeatures(features.map((f) => (f.id === id ? { ...f, text } : f)));
  };

  // Fetch all plans
  const fetchPlans = async () => {
    try {
      setIsLoadingPlans(true);
      const { data, error: fetchError } = await supabase
        .from("plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setPlans(data || []);
    } catch (err) {
      console.error("Fetch plans error:", err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Load plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const resetForm = () => {
    setPlanName("");
    setPlanNameHindi("");
    setAmount("");
    setCashbackPercentage("20");
    setFeatures([{ id: "1", text: "" }]);
    setEditingPlanId(null);
  };

  const startEdit = (plan: Plan) => {
    setPlanName(plan.plan_name);
    setPlanNameHindi(plan.plan_name_hindi || "");
    setAmount(plan.amount.toString());
    setCashbackPercentage(plan.cashback_percentage?.toString() || "20");
    setFeatures(
      plan.features.map((f, i) => ({
        id: i.toString(),
        text: f,
      })),
    );
    setEditingPlanId(plan.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!planName.trim()) {
      setError("Plan name is required");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Valid amount is required");
      return;
    }
    if (
      !cashbackPercentage ||
      parseFloat(cashbackPercentage) < 0 ||
      parseFloat(cashbackPercentage) > 100
    ) {
      setError("Cashback percentage must be between 0 and 100");
      return;
    }
    const validFeatures = features.filter((f) => f.text.trim() !== "");
    if (validFeatures.length === 0) {
      setError("At least one feature is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingPlanId) {
        // Update existing plan
        const { error: dbError } = await supabase
          .from("plans")
          .update({
            plan_name: planName.trim(),
            plan_name_hindi: planNameHindi.trim() || null,
            amount: parseFloat(amount),
            cashback_percentage: parseFloat(cashbackPercentage),
            features: validFeatures.map((f) => f.text.trim()),
          })
          .eq("id", editingPlanId);

        if (dbError) throw dbError;
        setSuccess("Plan updated successfully!");
      } else {
        // Create new plan
        const { data, error: dbError } = await supabase
          .from("plans")
          .insert([
            {
              plan_name: planName.trim(),
              plan_name_hindi: planNameHindi.trim() || null,
              amount: parseFloat(amount),
              cashback_percentage: parseFloat(cashbackPercentage),
              features: validFeatures.map((f) => f.text.trim()),
              is_active: true,
              created_at: new Date().toISOString(),
            },
          ])
          .select();

        if (dbError) throw dbError;
        setSuccess("Plan created successfully!");
      }

      // Reset form
      resetForm();

      // Reload plans list
      await fetchPlans();

      // Hide form after successful creation/update
      setTimeout(() => {
        setShowForm(false);
        setSuccess("");
      }, 2000);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to save plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const { error: dbError } = await supabase
        .from("plans")
        .delete()
        .eq("id", planId);

      if (dbError) throw dbError;

      setSuccess("Plan deleted successfully!");
      await fetchPlans();
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete plan");
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      resetForm();
      setError("");
      setSuccess("");
    } else {
      resetForm();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE]">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"></div>
            <button
              onClick={toggleForm}
              className="flex items-center gap-2 px-4 py-2 bg-[#03A9F4] text-white text-sm font-bold uppercase tracking-wide hover:bg-[#25476A] transition-colors shadow-sm"
            >
              {showForm ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Form
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create New Plan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Form - Only shows when button clicked */}
        {showForm && (
          <div className="mb-6 animate-fadeIn">
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-sm p-6 border-l-4 border-[#03A9F4]"
            >
              <h2 className="text-lg font-bold text-[#2B3674] uppercase tracking-wide mb-4">
                {editingPlanId ? "Edit Plan" : "Create New Plan"}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 flex items-start gap-2">
                  <div className="w-5 h-5 bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3 h-3 text-red-600" />
                  </div>
                  <p className="text-sm text-red-700 font-bold">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Save className="w-3 h-3 text-green-600" />
                  </div>
                  <p className="text-sm text-green-700 font-bold">{success}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Plan Name */}
                <div>
                  <label className="block text-xs font-bold text-[#2B3674] uppercase mb-1.5">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g., Premium Plan"
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all text-[#2B3674]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#2B3674] uppercase mb-1.5">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 50000"
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all text-[#2B3674]"
                  disabled={isSubmitting}
                />
              </div>
              {/* Cashback Percentage */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#2B3674] uppercase mb-1.5">
                  Instant Cashback (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={cashbackPercentage}
                  onChange={(e) => setCashbackPercentage(e.target.value)}
                  placeholder="e.g., 20"
                  min="0"
                  max="100"
                  step="1"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all text-[#2B3674]"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-[#A3AED0] mt-1">
                  Locked amount will be:{" "}
                  {100 - parseFloat(cashbackPercentage || "0")}%
                </p>
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#2B3674] uppercase">
                    Plan Features <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#03A9F4] hover:text-[#25476A] hover:bg-[#F4F7FE] transition-colors font-bold"
                    disabled={isSubmitting}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Feature
                  </button>
                </div>

                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div key={feature.id} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 w-6">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={feature.text}
                        onChange={(e) =>
                          updateFeature(feature.id, e.target.value)
                        }
                        placeholder="Enter feature"
                        className="flex-1 px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all text-[#2B3674]"
                        disabled={isSubmitting}
                      />
                      {features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(feature.id)}
                          className="p-2 text-red-500 hover:bg-red-50 transition-colors"
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={toggleForm}
                  className="px-4 py-2.5 text-sm font-bold text-[#2B3674] hover:bg-[#F4F7FE] transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#03A9F4] text-white text-sm font-bold uppercase tracking-wide hover:bg-[#25476A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingPlanId ? "Update Plan" : "Create Plan"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Plans Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#2B3674] uppercase tracking-wide">
              All Plans
              <span className="ml-2 text-sm font-normal text-[#A3AED0]">
                ({plans.length} {plans.length === 1 ? "plan" : "plans"})
              </span>
            </h2>
          </div>

          {isLoadingPlans ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-[#03A9F4] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-[#A3AED0] font-medium">
                Loading plans...
              </p>
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white shadow-sm border-l-4 border-[#03A9F4] py-12 text-center">
              <p className="text-sm font-bold text-[#2B3674] mb-1">
                No plans created yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white shadow-sm border-l-4 border-[#03A9F4] overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="bg-[#25476A] p-5 text-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1 uppercase tracking-wide">
                          {plan.plan_name}
                        </h3>
                        {plan.plan_name_hindi && (
                          <p className="text-sm text-[#03A9F4] opacity-90">
                            {plan.plan_name_hindi}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-bold ${
                          plan.is_active
                            ? "bg-green-400 text-green-900"
                            : "bg-gray-300 text-gray-700"
                        }`}
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        ₹{plan.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-400 text-green-900 text-xs font-bold">
                        {plan.cashback_percentage}% Instant
                      </span>
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold">
                        {100 - plan.cashback_percentage}% Locked
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {/* Features */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-[#2B3674] mb-3 uppercase tracking-wide">
                          Features
                        </p>
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm text-[#A3AED0]"
                            >
                              <div className="w-5 h-5 bg-[#F4F7FE] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="w-1.5 h-1.5 bg-[#03A9F4]"></div>
                              </div>
                              <span className="flex-1 text-[#2B3674]">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-xs text-[#A3AED0]">
                        Created on{" "}
                        <span className="font-bold text-[#2B3674]">
                          {new Date(plan.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(plan)}
                          className="p-2 text-[#03A9F4] hover:bg-[#F4F7FE] transition-colors"
                          title="Edit plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePlan(plan.id)}
                          className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PlanCreation;
