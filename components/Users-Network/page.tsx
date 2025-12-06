"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface AgentNode {
  id: string;
  agent_id: string;
  plan_id: string;
  parent_id: string | null;
  position: string;
  level: number;
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  agent?: {
    referral_code: string;
    is_active: boolean;
  };
  plan?: {
    name: string;
  };
  children: AgentNode[];
}
interface Plan {
  id: string;
  plan_name: string;
  amount?: number;
}

export default function AdminNetworkViewPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planSettings, setPlanSettings] = useState<any>(null);
  const [networkTree, setNetworkTree] = useState<AgentNode | null>(null);
  const [allPositions, setAllPositions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null);
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    maxLevel: 0,
    totalPlans: 0,
  });

  // Fetch all plans
  useEffect(() => {
    async function fetchPlans() {
      const { data } = await supabase
        .from("plans")
        .select("*")
        .order("plan_name");

      if (data && data.length > 0) {
        setPlans(data);
        setSelectedPlanId(data[0].id);
      }
      setLoading(false);
    }

    fetchPlans();
  }, []);

  // Fetch network when plan changes
  useEffect(() => {
    if (selectedPlanId) {
      fetchNetworkForPlan(selectedPlanId);
    }
  }, [selectedPlanId]);

  async function fetchNetworkForPlan(planId: string) {
    setLoading(true);

    try {
      // Get plan settings
      const { data: settings } = await supabase
        .from("plan_chain_settings")
        .select("*")
        .eq("plan_id", planId)
        .single();

      setPlanSettings(settings);

      // Get all positions for this plan
      const { data: positions } = await supabase
        .from("plan_binary_positions")
        .select(
          `
          *,
          agent:agents!plan_binary_positions_agent_id_fkey(
            id,
            referral_code,
            is_active,
            user:users(id, full_name, email, phone)
          ),
          plan:plans(id, plan_name)
        `
        )
        .eq("plan_id", planId)
        .order("level");

      setAllPositions(positions || []);

      if (!positions || positions.length === 0) {
        setNetworkTree(null);
        setStats({
          totalAgents: 0,
          activeAgents: 0,
          maxLevel: 0,
          totalPlans: 0,
        });
        setLoading(false);
        return;
      }

      // Find root (position='root' or parent_id is null)
      const rootPosition = positions.find(
        (p) => p.position === "root" || p.parent_id === null
      );

      if (!rootPosition) {
        setNetworkTree(null);
        setLoading(false);
        return;
      }

      // Build tree
      function buildTree(agentId: string): AgentNode | null {
        if (!positions) return null; // TypeScript null check
        const position = positions.find((p) => p.agent_id === agentId);
        if (!position) return null;

        const children: AgentNode[] = [];
        for (let i = 1; i <= 5; i++) {
          const childField = `child_${i}_id`;
          if (position[childField]) {
            const child = buildTree(position[childField]);
            if (child) children.push(child);
          }
        }

        return {
          id: position.id,
          agent_id: position.agent_id,
          plan_id: position.plan_id,
          parent_id: position.parent_id,
          position: position.position,
          level: position.level,
          user: position.agent?.user,
          agent: position.agent
            ? {
                referral_code: position.agent.referral_code,
                is_active: position.agent.is_active,
              }
            : undefined,
          plan: position.plan,
          children,
        };
      }

      const tree = buildTree(rootPosition.agent_id);
      setNetworkTree(tree);

      // Calculate stats
      const activeCount = positions.filter((p) => p.agent?.is_active).length;
      const maxLvl = Math.max(...positions.map((p) => p.level));

      setStats({
        totalAgents: positions.length,
        activeAgents: activeCount,
        maxLevel: maxLvl,
        totalPlans: plans.length,
      });
    } catch (error) {
      console.error("Error fetching network:", error);
    }

    setLoading(false);
  }

  function renderTreeNode(agent: AgentNode) {
    const matchesSearch = searchTerm
      ? agent.user?.full_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        agent.agent?.referral_code
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        agent.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return (
      <div key={agent.agent_id} className="flex flex-col items-center">
        {/* Agent Circle */}
        <div
          onClick={() => setSelectedAgent(agent)}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all
            ${matchesSearch ? "ring-2 ring-yellow-400" : ""}
            ${
              agent.agent?.is_active
                ? "bg-gradient-to-br from-green-500 to-green-600"
                : "bg-gradient-to-br from-gray-400 to-gray-500"
            }
            hover:scale-110 shadow-lg`}
        >
          <span className="text-white font-bold text-lg">
            {agent.user?.full_name?.[0]?.toUpperCase() || "?"}
          </span>

          {/* Level badge */}
          <div className="absolute -top-1 -right-1 bg-white text-gray-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
            {agent.level}
          </div>
        </div>

        {/* Agent Info */}
        <p className="text-xs font-medium mt-1 text-gray-700 text-center max-w-[100px] truncate">
          {agent.user?.full_name || "Unknown"}
        </p>

        {agent.position !== "root" && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full mt-0.5">
            {agent.position}
          </span>
        )}

        {/* Children */}
        {agent.children.length > 0 && (
          <div className="mt-4">
            {/* Connecting Lines */}
            <div className="relative h-6">
              <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-300 -translate-x-1/2"></div>

              {agent.children.length > 1 && (
                <div
                  className="absolute top-3 bg-gray-300 h-0.5"
                  style={{
                    left: `${50 / agent.children.length}%`,
                    right: `${50 / agent.children.length}%`,
                  }}
                ></div>
              )}

              {agent.children.map((_, idx) => {
                const totalChildren = agent.children.length;
                const spacing = 100 / (totalChildren + 1);
                const leftPosition = spacing * (idx + 1);

                return (
                  <div
                    key={idx}
                    className="absolute top-3 w-0.5 h-3 bg-gray-300"
                    style={{
                      left: `${leftPosition}%`,
                      transform: "translateX(-50%)",
                    }}
                  ></div>
                );
              })}
            </div>

            {/* Child Nodes */}
            <div
              className="flex justify-center gap-6"
              style={{
                maxWidth: agent.children.length > 2 ? "700px" : "350px",
              }}
            >
              {agent.children.map((child) => renderTreeNode(child))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Network Management
          </h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Agents</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalAgents}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.activeAgents}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Max Level</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.maxLevel}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.totalPlans}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4">
            {/* Plan Selector */}
            <select
              value={selectedPlanId || ""}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.plan_name}
                </option>
              ))}
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {planSettings && (
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm">
                <span className="font-semibold">Pairing:</span>{" "}
                {planSettings.pairing_limit}
                {planSettings.pairing_limit === 1
                  ? " (Linear)"
                  : planSettings.pairing_limit === 2
                  ? " (Binary)"
                  : planSettings.pairing_limit === 3
                  ? " (Tri-nary)"
                  : ` (${planSettings.pairing_limit}-way)`}
              </div>
            )}
          </div>
        </div>

        {/* Tree Visualization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Network Tree</h2>

          {networkTree ? (
            <div className="overflow-x-auto pb-4">
              <div className="inline-block min-w-full">
                {renderTreeNode(networkTree)}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No network data available for this plan.
            </div>
          )}
        </div>

        {/* Agents List Table */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            All Agents ({allPositions.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Children
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allPositions
                  .filter((pos) =>
                    searchTerm
                      ? pos.agent?.user?.full_name
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        pos.agent?.referral_code
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        pos.agent?.user?.email
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      : true
                  )
                  .map((pos) => {
                    const childrenCount = [1, 2, 3, 4, 5].filter(
                      (i) => pos[`child_${i}_id`]
                    ).length;

                    return (
                      <tr key={pos.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {pos.agent?.user?.full_name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {pos.agent?.referral_code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {pos.agent?.user?.email}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {pos.position}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          Level {pos.level}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {childrenCount}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              pos.agent?.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {pos.agent?.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedAgent(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedAgent.user?.full_name || "Unknown"}
                </h3>
                <p className="text-sm text-gray-500">
                  Code: {selectedAgent.agent?.referral_code}
                </p>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Email:</span>{" "}
                {selectedAgent.user?.email}
              </p>
              <p>
                <span className="font-semibold">Phone:</span>{" "}
                {selectedAgent.user?.phone}
              </p>
              <p>
                <span className="font-semibold">Position:</span>{" "}
                {selectedAgent.position}
              </p>
              <p>
                <span className="font-semibold">Level:</span>{" "}
                {selectedAgent.level}
              </p>
              <p>
                <span className="font-semibold">Children:</span>{" "}
                {selectedAgent.children.length}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {selectedAgent.agent?.is_active ? "Active" : "Inactive"}
              </p>
              <p>
                <span className="font-semibold">Plan:</span>{" "}
                {(selectedAgent.plan as any)?.plan_name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
