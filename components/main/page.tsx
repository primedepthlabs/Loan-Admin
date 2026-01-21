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
  CalendarCheck,
  Layers,
  LucideCheckSquare,
  ChartColumnDecreasing,
  TableOfContents,
  Wallet,
  Loader2,
  Coins,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import UsersPage from "../Users/page";
import AdminLoanManager from "../Loan-Options/page";
import AdminPaymentSettings from "../Payment-Management/page";
import AdminLoanSettings from "../Loan-Configuration/page";
import LoanApplications from "../Loan-Requests/page";
import EMIManagement from "../Emi-Management/page";
import AdminAgentCourses from "../Agent-Courses/page";
import CoursePayment from "../CoursePayment/page";
import CourseUsersPage from "../../app/course-users/page";
import ContentManagement from "../content-management/page";
import AdminNetworkViewPage from "../Users-Network/page";
import AdminWithdrawalDashboard from "../Withdrawls/page";
import AdminCommissionSettings from "../Commissions/page";
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
    { id: "users", label: "Users", icon: Users },
    { id: "loans", label: "Loan Manager", icon: IndianRupee },
    { id: "payment", label: "Payment Management", icon: QrCode },
    { id: "loansettings", label: "Loan Configuration", icon: Edit },
    { id: "loanrequests", label: "Loan Requests", icon: ClipboardList },
    { id: "emimanager", label: "EMI Management", icon: CalendarCheck },
    { id: "agentcourses", label: "Agent Courses", icon: Layers },
    { id: "coursepayment", label: "Course Payments", icon: LucideCheckSquare },
    { id: "manageaccess", label: "Manage Access", icon: ChartColumnDecreasing },
    { id: "commissions", label: "Manage Commissions", icon: Coins },
    { id: "contentmanagement", label: "Plan Resources", icon: TableOfContents },
    { id: "networkview", label: "User Network View", icon: Wallet },
    { id: "withdrawlrequests", label: "Withdrawal Requests", icon: Wallet },
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
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out flex flex-col border-r border-gray-200 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between p-4 bg-[#25476A] text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#03A9F4] flex items-center justify-center text-white">
              <span className="font-bold text-lg">L</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              ADMIN<span className="font-light ml-1">PANEL</span>
            </h1>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-300 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 cursor-pointer text-left transition-all duration-150 border-l-4 ${
                  isActive
                    ? "border-[#03A9F4] bg-[#F4F7FE] text-[#25476A]"
                    : "border-transparent bg-transparent text-[#A3AED0] hover:bg-gray-50 hover:text-[#2B3674]"
                }`}
              >
                <IconComponent
                  size={18}
                  className={`mr-3 transition-colors ${
                    isActive
                      ? "text-[#03A9F4]"
                      : "text-gray-400 group-hover:text-[#2B3674]"
                  }`}
                />
                <span
                  className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-left cursor-pointer hover:bg-red-50 text-red-500 hover:text-red-700 transition-all font-medium text-sm"
          >
            <LogOut size={18} className="mr-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-none z-40 lg:hidden"
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
      case "emimanager":
        return <EMIManagement />;
      case "agentcourses":
        return <AdminAgentCourses />;
      case "coursepayment":
        return <CoursePayment />;
      case "manageaccess":
        return <CourseUsersPage />;
          case "commissions":
        return <AdminCommissionSettings />;
      case "contentmanagement":
        return <ContentManagement />;
      case "networkview":
        return <AdminNetworkViewPage />;
      case "withdrawlrequests":
        return <AdminWithdrawalDashboard />;
      default:
        return <UsersPage />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
        <div className="bg-white p-6 shadow-md border border-gray-100 flex items-center gap-3">
          <Loader2 className="animate-spin text-[#03A9F4]" size={20} />
          <span className="text-[#2B3674] font-bold text-sm">
            LOADING PANEL...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header for mobile */}
        <header className="bg-white border-b border-gray-200 lg:hidden shadow-sm z-30">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-[#2B3674] hover:text-[#03A9F4] transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-sm font-bold text-[#2B3674] uppercase tracking-wide">
              {activeSection === "users"
                ? "Users"
                : activeSection.replace(/([A-Z])/g, " $1").trim()}
            </h1>
            <div className="w-6"></div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#F4F7FE]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Main;
