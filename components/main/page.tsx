"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  IndianRupee,
  Menu,
  X,
  LogOut,
  QrCode,
  Edit,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import UsersPage from "../Users/page";
import AdminLoanManager from "../Loan-Options/page";
import AdminPaymentSettings from "../Payment-Management/page";
import AdminLoanSettings from "../Loan-Configuration/page";
import LoanApplications from "../Loan-Requests/page";
interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  setActiveSection,
  isSidebarOpen,
  setIsSidebarOpen,
  user,
}) => {
  const router = useRouter();

  const menuItems = [
    {
      id: "users",
      label: "Users",
      icon: Users,
    },
    {
      id: "loans",
      label: "Loan Manager",
      icon: IndianRupee,
    },
    {
      id: "payment",
      label: "Payment Management",
      icon: QrCode,
    },
    {
      id: "loansettings",
      label: "Loan Configration",
      icon: Edit,
    },
    {
      id: "loanrequests",
      label: "Loan Requests",
      icon: ClipboardList,
    },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-medium">Admin Panel</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-2 flex-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 cursor-pointer text-left hover:bg-gray-50 ${
                  activeSection === item.id ? "bg-gray-100" : ""
                }`}
              >
                <IconComponent size={18} className="mr-3 text-gray-600" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section with User Info and Logout */}
        <div className="border-t">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-left cursor-pointer hover:bg-red-50 text-red-600 hover:text-red-700"
          >
            <LogOut size={18} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

const Main = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("users");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

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

  const renderContent = () => {
    switch (activeSection) {
      case "users":
        return <UsersPage />;
      case "loans":
        return <AdminLoanManager />;
      case "payment":
        return <AdminPaymentSettings />;
      case "loansettings":
        return <AdminLoanSettings />;
      case "loanrequests":
        return <LoanApplications />;
      default:
        return <UsersPage />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header for mobile */}
        <header className="bg-white border-b lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-600"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-medium">
              {activeSection === "users" ? "Users" : "Loan Manager"}
            </h1>
            <div className="w-5"></div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Main;
