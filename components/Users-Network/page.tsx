"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  Users,
  Activity,
  Layers,
  Filter,
  RefreshCw,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight as ChevronRightPagination,
  X,
} from "lucide-react";

interface AgentNode {
  id: string;
  agent_id: string;
  plan_id: string;
  parent_id: string | null;
  position: string;
  level: number;
  child_1_id?: string | null;
  child_2_id?: string | null;
  child_3_id?: string | null;
  child_4_id?: string | null;
  child_5_id?: string | null;
  agent?: {
    referral_code: string;
    is_active: boolean;
    agent_plans?: AgentPlan[];
    user?: {
      id: string;
      name: string;
      email: string;
      mobile_number?: string;
    };
  };
  plan?: {
    plan_name: string;
  };
}
interface AgentPlan {
  plan_id: string;
  is_active: boolean;
  plans: {
    id: string;
    plan_name: string;
  };
}
export default function CompactNetworkView() {
  const [allPositions, setAllPositions] = useState<AgentNode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    maxLevel: 0,
    totalPlans: 0,
  });
  const [agentCommissions, setAgentCommissions] = useState<Map<string, number>>(
    new Map(),
  );
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentAgent();
    fetchAllNetwork();
  }, []);
  async function fetchCurrentAgent() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .single();

    if (!userData) return;

    const { data: agentData } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", userData.id)
      .single();

    if (agentData) {
      setCurrentAgentId(agentData.id);
    }
  }
  async function fetchAllNetwork() {
    setLoading(true);
    try {
      const { data: positions, error } = await supabase
        .from("plan_binary_positions")
        .select(
          `
    *,
    agent:agents!plan_binary_positions_agent_id_fkey(
      id,
      referral_code,
      is_active,
      user:users(id, name, email, mobile_number),
      agent_plans!inner(
        plan_id,
        is_active,
        plans(id, plan_name)
      )
    ),
    plan:plans(id, plan_name)
  `,
        )
        .order("level");

      if (!error && positions) {
        setAllPositions(positions);

        const activeCount = positions.filter((p) => p.agent?.is_active).length;
        const maxLvl =
          positions.length > 0 ? Math.max(...positions.map((p) => p.level)) : 0;
        const uniquePlans = new Set(positions.map((p) => p.plan_id)).size;

        setStats({
          totalAgents: positions.length,
          activeAgents: activeCount,
          maxLevel: maxLvl,
          totalPlans: uniquePlans,
        });
      }
    } catch (error) {
      console.error("Error fetching network:", error);
    }
    setLoading(false);
  }

  // Get parent of an agent
  const getParent = (agent: AgentNode) => {
    if (!agent.parent_id) return null;
    // parent_id is an agent_id, so find the position record where agent_id matches
    return allPositions.find((p) => p.agent_id === agent.parent_id);
  };

  // Get children of an agent
  const getChildren = (agent: AgentNode) => {
    const childKeys: Array<keyof AgentNode> = [
      "child_1_id",
      "child_2_id",
      "child_3_id",
      "child_4_id",
      "child_5_id",
    ];

    const children: AgentNode[] = [];
    childKeys.forEach((key) => {
      const childAgentId = agent[key];
      if (childAgentId && typeof childAgentId === "string") {
        // Find the position record where agent_id matches the child agent id
        const child = allPositions.find((p) => p.agent_id === childAgentId);
        if (child) {
          children.push(child);
        }
      }
    });

    return children;
  };
  const handleRowClick = async (agent: AgentNode) => {
    setSelectedAgent(agent);
    setShowModal(true);

    // Fetch commissions THIS AGENT has earned from THEIR children
    if (agent.agent_id) {
      const { data: commissionsData } = await supabase
        .from("commissions")
        .select("plan_id, commission_amount, plans!inner(plan_name)")
        .eq("agent_id", agent.agent_id) // ← THIS agent's earnings
        .in("status", ["paid", "pending"]);

      // Group by plan
      const commMap = new Map<string, number>();
      commissionsData?.forEach((c: any) => {
        const planName = c.plans?.plan_name || "Unknown";
        const current = commMap.get(planName) || 0;
        commMap.set(planName, current + Number(c.commission_amount));
      });

      setAgentCommissions(commMap);
    }
  };

  const filteredPositions = useMemo(() => {
    return allPositions.filter((pos) => {
      const matchesSearch = searchTerm
        ? pos.agent?.user?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          pos.agent?.referral_code
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          pos.agent?.user?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          pos.plan?.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchesPlan =
        selectedPlan === "all" || pos.plan_id === selectedPlan;

      return matchesSearch && matchesPlan;
    });
  }, [allPositions, searchTerm, selectedPlan]);

  // Pagination
  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const paginatedPositions = filteredPositions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPlan, itemsPerPage]);

  const getChildrenCount = (pos: AgentNode) => {
    const childKeys: Array<keyof AgentNode> = [
      "child_1_id",
      "child_2_id",
      "child_3_id",
      "child_4_id",
      "child_5_id",
    ];
    return childKeys.filter((key) => pos[key]).length;
  };

  const uniquePlans = useMemo(() => {
    return Array.from(
      new Set(
        allPositions
          .map((p) => ({
            id: p.plan_id,
            name: p.plan?.plan_name || "Unknown",
          }))
          .map((p) => JSON.stringify(p)),
      ),
    ).map((p) => JSON.parse(p));
  }, [allPositions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-3 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-3 text-gray-600 text-sm">Loading network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-800">
              Network Overview
            </h1>
            <button
              onClick={fetchAllNetwork}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-blue-50 rounded p-2 border-l-2 border-blue-500">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] text-gray-500 font-medium">
                  TOTAL
                </span>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {stats.totalAgents}
              </p>
            </div>
            <div className="bg-green-50 rounded p-2 border-l-2 border-green-500">
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-green-600" />
                <span className="text-[10px] text-gray-500 font-medium">
                  ACTIVE
                </span>
              </div>
              <p className="text-lg font-bold text-green-700">
                {stats.activeAgents}
              </p>
            </div>
            <div className="bg-purple-50 rounded p-2 border-l-2 border-purple-500">
              <div className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-600" />
                <span className="text-[10px] text-gray-500 font-medium">
                  LEVELS
                </span>
              </div>
              <p className="text-lg font-bold text-purple-700">
                {stats.maxLevel}
              </p>
            </div>
            <div className="bg-orange-50 rounded p-2 border-l-2 border-orange-500">
              <div className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-orange-600" />
                <span className="text-[10px] text-gray-500 font-medium">
                  PLANS
                </span>
              </div>
              <p className="text-lg font-bold text-orange-700">
                {stats.totalPlans}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Plans</option>
              {uniquePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700">
                    Code
                  </th>
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700">
                    Phone
                  </th>
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-700">
                    Plan
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold text-gray-700">
                    Pos
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold text-gray-700">
                    Lvl
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold text-gray-700">
                    Kids
                  </th>
                  <th className="px-2 py-1.5 text-center font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedPositions.map((pos, idx) => {
                  const childrenCount = getChildrenCount(pos);

                  return (
                    <tr
                      key={pos.id}
                      onClick={() => handleRowClick(pos)}
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: idx % 2 === 0 ? "white" : "#fafafa",
                      }}
                    >
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-900 truncate max-w-[120px]">
                            {pos.agent?.user?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="font-mono text-gray-600 text-[11px]">
                          {pos.agent?.referral_code || "-"}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-gray-600 truncate max-w-[150px] block">
                          {pos.agent?.user?.email || "-"}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-gray-600 text-[11px]">
                          {pos.agent?.user?.mobile_number || "-"}
                        </span>
                      </td>

                      <td className="px-2 py-1.5">
                        {pos.agent?.agent_plans &&
                        pos.agent.agent_plans.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                              {pos.agent.agent_plans[0].plans.plan_name}
                            </span>
                            {pos.agent.agent_plans.length > 1 && (
                              <span className="inline-block px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px] font-medium">
                                +{pos.agent.agent_plans.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
                            No plans
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-1.5 text-center">
                        <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px]">
                          {pos.position}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-700 rounded-full font-bold text-[10px]">
                          {pos.level}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span
                          className={`font-medium ${childrenCount > 0 ? "text-orange-600" : "text-gray-500"}`}
                        >
                          {childrenCount}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              pos.agent?.is_active
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                            title={pos.agent?.is_active ? "Active" : "Inactive"}
                          ></span>
                          <span
                            className={`text-[10px] ${
                              pos.agent?.is_active
                                ? "text-green-700"
                                : "text-gray-500"
                            }`}
                          >
                            {pos.agent?.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredPositions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm font-medium">No agents found</p>
                <p className="text-xs mt-1">
                  Try adjusting your search or filter
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredPositions.length > 0 && (
            <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  Showing{" "}
                  <span className="font-semibold">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredPositions.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {filteredPositions.length}
                  </span>{" "}
                  agents
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="First page"
                  >
                    <ChevronsLeft className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-0.5 px-2">
                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = idx + 1;
                      } else if (currentPage <= 3) {
                        pageNum = idx + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + idx;
                      } else {
                        pageNum = currentPage - 2 + idx;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next page"
                  >
                    <ChevronRightPagination className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Last page"
                  >
                    <ChevronsRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Details Modal */}
      {showModal && selectedAgent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Agent Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Current Agent Info */}
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">
                  Current Agent
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-semibold text-gray-900">
                      {selectedAgent.agent?.user?.name || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Referral Code:</span>
                    <p className="font-mono font-semibold text-gray-900">
                      {selectedAgent.agent?.referral_code || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-semibold text-gray-900">
                      {selectedAgent.agent?.user?.email || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-semibold text-gray-900">
                      {selectedAgent.agent?.user?.mobile_number || "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Plan:</span>
                    <p className="font-semibold text-gray-900">
                      {selectedAgent.plan?.plan_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Position:</span>
                    <p className="font-semibold text-gray-900">
                      {selectedAgent.position}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Level:</span>
                    <p className="font-semibold text-gray-900">
                      {selectedAgent.level}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p
                      className={`font-semibold ${selectedAgent.agent?.is_active ? "text-green-700" : "text-gray-500"}`}
                    >
                      {selectedAgent.agent?.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>{" "}
                {selectedAgent.agent?.agent_plans &&
                  selectedAgent.agent.agent_plans.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <span className="text-gray-600 text-sm block mb-2">
                        All Purchased Plans:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedAgent.agent.agent_plans.map((ap) => (
                          <span
                            key={ap.plan_id}
                            className="inline-block px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium"
                          >
                            {ap.plans.plan_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                {/* Commission Generated */}
                {agentCommissions.size > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <span className="text-gray-600 text-sm block mb-2">
                      Total Commissions Earned by This Agent:
                    </span>
                    <div className="space-y-1">
                      {Array.from(agentCommissions.entries()).map(
                        ([planName, amount]) => (
                          <div
                            key={planName}
                            className="flex justify-between items-center bg-white rounded px-2 py-1"
                          >
                            <span className="text-xs text-gray-700">
                              {planName}
                            </span>
                            <span className="text-xs font-bold text-green-600">
                              ₹{amount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        ),
                      )}
                      <div className="flex justify-between items-center bg-green-100 rounded px-2 py-1 mt-2">
                        <span className="text-xs font-semibold text-green-900">
                          Total:
                        </span>
                        <span className="text-sm font-bold text-green-700">
                          ₹
                          {Array.from(agentCommissions.values())
                            .reduce((a, b) => a + b, 0)
                            .toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>{" "}
              {/* Parent Info */}
              {(() => {
                const parent = getParent(selectedAgent);
                return parent ? (
                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <h3 className="text-sm font-semibold text-purple-900 mb-3">
                      Parent Agent
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-semibold text-gray-900">
                          {parent.agent?.user?.name || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Referral Code:</span>
                        <p className="font-mono font-semibold text-gray-900">
                          {parent.agent?.referral_code || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-semibold text-gray-900">
                          {parent.agent?.user?.email || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Level:</span>
                        <p className="font-semibold text-gray-900">
                          {parent.level}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                    <p className="text-sm text-gray-600">
                      No parent agent (Root level)
                    </p>
                  </div>
                );
              })()}
              {/* Children Info */}
              {(() => {
                const children = getChildren(selectedAgent);
                return children.length > 0 ? (
                  <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <h3 className="text-sm font-semibold text-green-900 mb-3">
                      Children Agents ({children.length})
                    </h3>
                    <div className="space-y-3">
                      {children.map((child, idx) => (
                        <div
                          key={child.id}
                          className="bg-white rounded p-3 border border-green-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500">
                              Child #{idx + 1}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${child.agent?.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                            >
                              {child.agent?.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Name:</span>
                              <p className="font-semibold text-gray-900">
                                {child.agent?.user?.name || "Unknown"}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Code:</span>
                              <p className="font-mono font-semibold text-gray-900">
                                {child.agent?.referral_code || "-"}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <p className="font-semibold text-gray-900 truncate">
                                {child.agent?.user?.email || "-"}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Position:</span>
                              <p className="font-semibold text-gray-900">
                                {child.position}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                    <p className="text-sm text-gray-600">No children agents</p>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
