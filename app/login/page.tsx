"use client";
import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface FormData {
  email: string;
  password: string;
}

const AdminLogin = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setMessage("Email is required");
      setMessageType("error");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage("Please enter a valid email address");
      setMessageType("error");
      return false;
    }

    if (!formData.password) {
      setMessage("Password is required");
      setMessageType("error");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setMessage("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Sign in user with Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("user_id", authData.user.id)
          .single();

        if (adminError || !adminData) {
          await supabase.auth.signOut();
          throw new Error("Access denied. Admin account required.");
        }

        setFormData({
          email: "",
          password: "",
        });

        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again.";
      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto space-y-6 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-medium text-gray-900">Admin Login</h2>
          <p className="mt-1 text-sm text-gray-600">
            Sign in to your admin account
          </p>
        </div>

        <div className="space-y-3">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                name="email"
                type="email"
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                className="block w-full pl-9 pr-9 py-2 border border-gray-300 rounded text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 cursor-pointer flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-2 rounded text-sm ${
              messageType === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 cursor-pointer border border-transparent text-sm font-medium rounded text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <a href="#" className="text-sm text-gray-600 hover:text-gray-800">
            Forgot your password?
          </a>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <a
              href="/Signup"
              className="font-medium text-gray-800 hover:text-gray-900"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
