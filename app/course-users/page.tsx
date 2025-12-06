"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User, DollarSign, Calendar, Settings } from "lucide-react";
import Link from "next/link";

interface PaidUser {
  id: string;
  user_id: string;
  plan_id: string;
  payment_amount: number;
  payment_status: string;
  submitted_at: string;
  verified_at: string;
  user_name: string;
  user_email: string;
  plan_name: string;
}

export default function CourseUsersPage() {
  const [users, setUsers] = useState<PaidUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPaidUsers();
  }, []);

  const fetchPaidUsers = async () => {
    try {
      setLoading(true);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("course_payments")
        .select("*")
        .eq("payment_status", "verified")
        .order("verified_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      if (!paymentsData || paymentsData.length === 0) {
        setUsers([]);
        return;
      }

      const userIds = [...new Set(paymentsData.map((p) => p.user_id))];
      const { data: usersData } = await supabase
        .from("users")
        .select("auth_user_id, name, email")
        .in("auth_user_id", userIds);

      const planIds = [...new Set(paymentsData.map((p) => p.plan_id))];
      const { data: plansData } = await supabase
        .from("plans")
        .select("id, plan_name")
        .in("id", planIds);

      const usersMap = new Map(
        usersData?.map((u) => [u.auth_user_id, u]) || []
      );
      const plansMap = new Map(plansData?.map((p) => [p.id, p]) || []);

      const enrichedUsers = paymentsData.map((payment) => {
        const user = usersMap.get(payment.user_id);
        const plan = plansMap.get(payment.plan_id);

        return {
          ...payment,
          user_name: user?.name || "Unknown",
          user_email: user?.email || "N/A",
          plan_name: plan?.plan_name || "Unknown Plan",
        };
      });

      setUsers(enrichedUsers);
    } catch (error) {
      console.error("Error fetching paid users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.plan_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Course Users Management
          </h1>
          <p className="text-sm text-gray-600">
            Manage access and permissions for paid users
          </p>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, email, or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">
                Total Users
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {users.length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">
                Total Revenue
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              ₹
              {users
                .reduce((sum, user) => sum + Number(user.payment_amount), 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">
                This Month
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {
                users.filter((u) => {
                  const date = new Date(u.verified_at);
                  const now = new Date();
                  return (
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">No paid users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-gray-700">User</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Plan</th>
                  <th className="px-4 py-3 font-medium text-gray-700 text-right">
                    Amount
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-700">
                    Verified Date
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-700 text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.user_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.user_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {user.plan_name}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ₹{user.payment_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(user.verified_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/course-users/${user.user_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors"
                      >
                        <Settings className="w-3 h-3" />
                        Manage Access
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
