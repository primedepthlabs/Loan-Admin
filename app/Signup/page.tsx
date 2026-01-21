"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const AdminSignup = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({ 
    fullName: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message) setMessage("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMessage("");
    
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setMessage("All fields are required");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName, role: "admin" } },
      });
      if (error) throw error;
      if (data.user) {
        await supabase.from("admins").insert({
          user_id: data.user.id,
          full_name: formData.fullName,
          email: formData.email,
        });
        setMessage("Account created. Redirecting...");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err: any) {
      setMessage(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-4">
      <div className="w-full max-w-[380px] bg-white shadow-lg overflow-hidden border border-gray-100">
        
        <div className="bg-[#25476A] p-6 text-center">
            <h2 className="text-white text-xl font-bold uppercase tracking-wider">Create Account</h2>
            <p className="text-[#03A9F4] text-xs mt-1">Join the admin team</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[#2B3674] text-xs font-bold uppercase tracking-wide">Full Name</label>
              <input
                name="fullName"
                className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-[#2B3674] placeholder-gray-400 focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all"
                placeholder="John Doe"
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#2B3674] text-xs font-bold uppercase tracking-wide">Email</label>
              <input
                name="email"
                type="email"
                className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-[#2B3674] placeholder-gray-400 focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all"
                placeholder="mail@simmmple.com"
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#2B3674] text-xs font-bold uppercase tracking-wide">Password</label>
               <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-[#2B3674] placeholder-gray-400 focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all"
                  placeholder="Min. 8 characters"
                  onChange={handleChange}
                />
                 <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-[#25476A]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

             <div className="space-y-1">
              <label className="text-[#2B3674] text-xs font-bold uppercase tracking-wide">Confirm Password</label>
              <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-[#2B3674] placeholder-gray-400 focus:outline-none focus:border-[#03A9F4] focus:ring-1 focus:ring-[#03A9F4] transition-all"
                  placeholder="Confirm password"
                  onChange={handleChange}
                />
            </div>

            {message && (
               <div className="bg-red-50 text-red-500 text-xs px-3 py-2 border-l-2 border-red-500">
                  {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#25476A] hover:bg-[#1B365D] text-white font-bold py-3 text-sm shadow-md transition-all active:translate-y-px mt-2"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "COMPLETE REGISTRATION"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-4">
               <p className="text-gray-500 text-xs">
                  Already a member?{" "}
                  <a href="/login" className="text-[#25476A] font-bold hover:text-[#03A9F4] transition-colors">
                      Sign In
                  </a>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
