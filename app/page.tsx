"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Main from "@/components/main/page";
import { Sidebar } from "lucide-react";

const Home = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login"); // Redirect to login if no session
        return;
      }

      // Check if user is admin
      const { data: adminData, error } = await supabase
        .from("admins")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error || !adminData) {
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      setUser(session.user);
      setLoading(false);
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Main />
    </div>
  );
};

export default Home;
