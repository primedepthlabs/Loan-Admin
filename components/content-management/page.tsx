"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Upload,
  Video,
  FileText,
  Trash2,
  Plus,
  X,
  Save,
  Loader2,
  Network,
  Users,
  TrendingUp,
  Edit3,
  CheckCircle,
} from "lucide-react";

interface Plan {
  id: string;
  plan_name: string;
  amount: number;
}

interface VideoItem {
  id: string;
  title: string;
  video_url: string;
  description: string;
  plan_id: string;
  plan_name?: string;
  created_at: string;
}

interface PDFItem {
  id: string;
  title: string;
  pdf_url: string;
  description: string;
  plan_id: string;
  plan_name?: string;
  file_size?: number;
  created_at: string;
}

interface ChainSetting {
  id: string;
  plan_id: string;
  pairing_limit: number;
  max_depth: number;
  created_at: string;
  updated_at: string;
}

interface PlanWithChain extends Plan {
  chain_setting?: ChainSetting;
  agent_count?: number;
  active_agents?: number;
}

export default function PlanResourcesManagement() {
  const [activeTab, setActiveTab] = useState<"videos" | "pdfs" | "chains">(
    "videos"
  );
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansWithChain, setPlansWithChain] = useState<PlanWithChain[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states for Videos/PDFs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Form states for Chain System
  const [showChainModal, setShowChainModal] = useState(false);
  const [editingChainPlan, setEditingChainPlan] = useState<string | null>(null);
  const [pairingLimit, setPairingLimit] = useState<number>(1);
  const [maxDepth, setMaxDepth] = useState<number>(1);
  const [savingChain, setSavingChain] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch plans
      const { data: plansData } = await supabase
        .from("plans")
        .select("id, plan_name, amount")
        .eq("is_active", true)
        .order("plan_name");

      setPlans(plansData || []);

      if (activeTab === "videos") {
        const { data: videosData } = await supabase
          .from("videos")
          .select("*")
          .order("created_at", { ascending: false });

        const enriched = (videosData || []).map((video) => ({
          ...video,
          plan_name:
            plansData?.find((p) => p.id === video.plan_id)?.plan_name ||
            "All Plans",
        }));

        setVideos(enriched);
      } else if (activeTab === "pdfs") {
        const { data: pdfsData } = await supabase
          .from("pdfs")
          .select("*")
          .order("created_at", { ascending: false });

        const enriched = (pdfsData || []).map((pdf) => ({
          ...pdf,
          plan_name:
            plansData?.find((p) => p.id === pdf.plan_id)?.plan_name ||
            "All Plans",
        }));

        setPdfs(enriched);
      } else if (activeTab === "chains") {
        // Fetch chain settings with agent counts
        const { data: chainSettings } = await supabase
          .from("plan_chain_settings")
          .select("*");

        const { data: agentsData } = await supabase
          .from("agents")
          .select("plan_id, is_active");

        const plansWithChainData: PlanWithChain[] = (plansData || []).map(
          (plan) => {
            const chainSetting = chainSettings?.find(
              (cs) => cs.plan_id === plan.id
            );
            const planAgents =
              agentsData?.filter((a) => a.plan_id === plan.id) || [];
            const activeAgents = planAgents.filter((a) => a.is_active);

            return {
              ...plan,
              chain_setting: chainSetting,
              agent_count: planAgents.length,
              active_agents: activeAgents.length,
            };
          }
        );

        setPlansWithChain(plansWithChainData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadPdf = async (file: File) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("course-pdfs")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("course-pdfs")
        .getPublicUrl(fileName);

      return { url: urlData.publicUrl, size: file.size };
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload PDF");
      return null;
    }
  };

  const handleSubmit = async () => {
    try {
      if (!title || !selectedPlan) {
        alert("Please fill in all required fields");
        return;
      }

      setUploading(true);

      if (activeTab === "videos") {
        if (!videoUrl) {
          alert("Please enter a video URL");
          setUploading(false);
          return;
        }

        const { error } = await supabase.from("videos").insert([
          {
            title,
            description,
            video_url: videoUrl,
            plan_id: selectedPlan,
          },
        ]);

        if (error) throw error;
        alert("Video added successfully!");
      } else {
        if (!pdfFile) {
          alert("Please select a PDF file");
          setUploading(false);
          return;
        }

        const uploadResult = await uploadPdf(pdfFile);
        if (!uploadResult) {
          setUploading(false);
          return;
        }

        const { error } = await supabase.from("pdfs").insert([
          {
            title,
            description,
            pdf_url: uploadResult.url,
            plan_id: selectedPlan,
            file_size: uploadResult.size,
          },
        ]);

        if (error) throw error;
        alert("PDF uploaded successfully!");
      }

      resetForm();
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to add content");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const table = activeTab === "videos" ? "videos" : "pdfs";
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) throw error;

      alert("Deleted successfully!");
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedPlan("");
    setVideoUrl("");
    setPdfFile(null);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Chain System Functions
  const openChainModal = (plan: PlanWithChain) => {
    setEditingChainPlan(plan.id);
    if (plan.chain_setting) {
      setPairingLimit(plan.chain_setting.pairing_limit);
      setMaxDepth(plan.chain_setting.max_depth);
    } else {
      setPairingLimit(1);
      setMaxDepth(1);
    }
    setShowChainModal(true);
  };

  const handleSaveChainSettings = async () => {
    if (!editingChainPlan) return;

    try {
      setSavingChain(true);

      const plan = plansWithChain.find((p) => p.id === editingChainPlan);
      if (!plan) return;

      if (plan.chain_setting) {
        // Update existing
        const { error } = await supabase
          .from("plan_chain_settings")
          .update({
            pairing_limit: pairingLimit,
            max_depth: maxDepth,
            updated_at: new Date().toISOString(),
          })
          .eq("plan_id", editingChainPlan);

        if (error) throw error;
        alert("Chain settings updated successfully!");
      } else {
        // Create new
        const { error } = await supabase.from("plan_chain_settings").insert([
          {
            plan_id: editingChainPlan,
            pairing_limit: pairingLimit,
            max_depth: maxDepth,
          },
        ]);

        if (error) throw error;
        alert("Chain settings created successfully!");
      }

      setShowChainModal(false);
      setEditingChainPlan(null);
      fetchData();
    } catch (error) {
      console.error("Save chain error:", error);
      alert("Failed to save chain settings");
    } finally {
      setSavingChain(false);
    }
  };

  const deleteChainSettings = async (planId: string) => {
    if (!confirm("Are you sure you want to delete these chain settings?"))
      return;

    try {
      const { error } = await supabase
        .from("plan_chain_settings")
        .delete()
        .eq("plan_id", planId);

      if (error) throw error;
      alert("Chain settings deleted successfully!");
      fetchData();
    } catch (error) {
      console.error("Delete chain error:", error);
      alert("Failed to delete chain settings");
    }
  };

  // Generate tree visualization nodes
  const generateTreeNodes = (pairingLimit: number) => {
    const nodes = [];
    for (let i = 0; i < pairingLimit; i++) {
      nodes.push(i);
    }
    return nodes;
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white shadow-sm p-6 border-l-4 border-[#03A9F4]">
          <h1 className="text-3xl font-bold text-[#2B3674] uppercase tracking-wide">
            Plan Resources Management
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 bg-white shadow-sm p-1">
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-all ${
                activeTab === "videos"
                  ? "bg-[#03A9F4] text-white shadow-sm"
                  : "text-[#A3AED0] hover:text-[#2B3674] hover:bg-[#F4F7FE]"
              }`}
            >
              <Video className="w-4 h-4" />
              Videos ({videos.length})
            </button>
            <button
              onClick={() => setActiveTab("pdfs")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-all ${
                activeTab === "pdfs"
                  ? "bg-[#03A9F4] text-white shadow-sm"
                  : "text-[#A3AED0] hover:text-[#2B3674] hover:bg-[#F4F7FE]"
              }`}
            >
              <FileText className="w-4 h-4" />
              PDFs ({pdfs.length})
            </button>
            <button
              onClick={() => setActiveTab("chains")}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-all ${
                activeTab === "chains"
                  ? "bg-[#03A9F4] text-white shadow-sm"
                  : "text-[#A3AED0] hover:text-[#2B3674] hover:bg-[#F4F7FE]"
              }`}
            >
              <Network className="w-4 h-4" />
              Chain System ({plansWithChain.length})
            </button>
          </div>

          {activeTab !== "chains" && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#03A9F4] text-white text-sm font-bold uppercase tracking-wide hover:bg-[#25476A] transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add {activeTab === "videos" ? "Video" : "PDF"}
            </button>
          )}
        </div>

        {/* Content Grid - Videos/PDFs */}
        {activeTab !== "chains" && (
          <>
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin h-10 w-10 border-4 border-[#03A9F4] border-t-transparent mx-auto"></div>
                <p className="text-sm text-[#A3AED0] mt-3 font-medium">Loading...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeTab === "videos"
                  ? videos.map((video) => (
                      <div
                        key={video.id}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Video className="w-5 h-5 text-blue-600" />
                          </div>
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-base">
                          {video.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                          {video.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between text-xs pt-3 border-t">
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium">
                            {video.plan_name}
                          </span>
                          <a
                            href={video.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            View Video
                          </a>
                        </div>
                      </div>
                    ))
                  : pdfs.map((pdf) => (
                      <div
                        key={pdf.id}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <FileText className="w-5 h-5 text-green-600" />
                          </div>
                          <button
                            onClick={() => handleDelete(pdf.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-base">
                          {pdf.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                          {pdf.description || "No description"}
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                          Size: {formatFileSize(pdf.file_size)}
                        </p>
                        <div className="flex items-center justify-between text-xs pt-3 border-t">
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium">
                            {pdf.plan_name}
                          </span>
                          <a
                            href={pdf.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 font-medium hover:underline"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
              </div>
            )}

            {/* Empty State */}
            {!loading &&
              ((activeTab === "videos" && videos.length === 0) ||
                (activeTab === "pdfs" && pdfs.length === 0)) && (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <div className="mb-4">
                    {activeTab === "videos" ? (
                      <Video className="w-16 h-16 text-gray-300 mx-auto" />
                    ) : (
                      <FileText className="w-16 h-16 text-gray-300 mx-auto" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    No {activeTab} found
                  </p>
                  <p className="text-xs text-gray-500">
                    Click "Add" button to create content
                  </p>
                </div>
              )}
          </>
        )}

        {/* Chain System Dashboard */}
        {activeTab === "chains" && (
          <>
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-300 border-t-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-3">
                  Loading chain data...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plansWithChain.map((plan, index) => (
                  <div
                    key={plan.id}
                    className="group bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-400 transition-all duration-500 overflow-hidden hover:shadow-2xl transform hover:-translate-y-2"
                  >
                    {/* Plan Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">
                              {plan.plan_name}
                            </h3>
                            <p className="text-2xl font-bold text-white">
                              ₹{plan.amount.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <Network className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Section */}
                    <div className="p-5 bg-gray-50">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-gray-600 font-medium">
                              Total Agents
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {plan.agent_count || 0}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-600 font-medium">
                              Active
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {plan.active_agents || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Chain Settings */}
                    <div className="p-5">
                      {plan.chain_setting ? (
                        <>
                          {/* Mini Tree Visualization */}
                          <div className="mb-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                              Chain Structure
                            </p>
                            <div className="flex flex-col items-center space-y-3">
                              {/* Root Node */}
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                  <Users className="w-5 h-5 text-white" />
                                </div>
                              </div>

                              {/* Connector Lines */}
                              <div className="flex items-center gap-1">
                                {generateTreeNodes(
                                  plan.chain_setting.pairing_limit
                                ).map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-px h-8 bg-gradient-to-b from-blue-400 to-purple-400"
                                  ></div>
                                ))}
                              </div>

                              {/* Child Nodes */}
                              <div className="flex items-center gap-3">
                                {generateTreeNodes(
                                  plan.chain_setting.pairing_limit
                                ).map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-md"
                                  >
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Chain Info */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <span className="text-xs font-medium text-gray-700">
                                Pairing Limit
                              </span>
                              <span className="text-sm font-bold text-blue-600">
                                {plan.chain_setting.pairing_limit} Pair
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <span className="text-xs font-medium text-gray-700">
                                Max Depth
                              </span>
                              <span className="text-sm font-bold text-purple-600">
                                {plan.chain_setting.max_depth} Levels
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => openChainModal(plan)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteChainSettings(plan.id)}
                              className="px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-all border border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <div className="mb-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                              <Network className="w-8 h-8 text-gray-400" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            No Chain Settings
                          </p>
                          <p className="text-xs text-gray-500 mb-4">
                            Configure pairing and depth
                          </p>
                          <button
                            onClick={() => openChainModal(plan)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all mx-auto shadow-md"
                          >
                            <Plus className="w-4 h-4" />
                            Configure Chain
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && plansWithChain.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <div className="mb-4">
                  <Network className="w-16 h-16 text-gray-300 mx-auto" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  No plans available
                </p>
                <p className="text-xs text-gray-500">
                  Create plans first to configure chain settings
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Video/PDF Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                Add {activeTab === "videos" ? "Video" : "PDF"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                  placeholder="Enter title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all resize-none"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan *
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                >
                  <option value="">Select a plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.plan_name} (₹{plan.amount.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === "videos" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video URL * (YouTube, Vimeo, etc.)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {activeTab === "pdfs" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload PDF File *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="pdfFile"
                    />
                    <label
                      htmlFor="pdfFile"
                      className="cursor-pointer text-sm text-gray-600 hover:text-gray-900"
                    >
                      {pdfFile ? (
                        <span className="text-green-600 font-semibold flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          {pdfFile.name}
                        </span>
                      ) : (
                        "Click to upload PDF"
                      )}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Max 10MB</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {activeTab === "videos" ? "Saving..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {activeTab === "videos" ? "Save Video" : "Upload PDF"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chain Settings Modal */}
      {showChainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                Configure Chain Settings
              </h2>
              <button
                onClick={() => {
                  setShowChainModal(false);
                  setEditingChainPlan(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pairing Limit *
                </label>
                <select
                  value={pairingLimit}
                  onChange={(e) => setPairingLimit(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                >
                  <option value={1}>1 Pair (Linear)</option>
                  <option value={2}>2 Pair (Binary)</option>
                  <option value={3}>3 Pair (Tri-nary)</option>
                  <option value={4}>4 Pair</option>
                  <option value={5}>5 Pair</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">
                  Number of direct referrals allowed per user
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Depth (Levels) *
                </label>
                <select
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                >
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((level) => (
                    <option key={level} value={level}>
                      {level} Level{level > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1.5">
                  Maximum depth of the referral chain
                </p>
              </div>

              {/* Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-100">
                <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Preview Structure
                </p>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    {generateTreeNodes(pairingLimit).map((_, i) => (
                      <div
                        key={i}
                        className="w-px h-6 bg-gradient-to-b from-blue-400 to-purple-400"
                      ></div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {generateTreeNodes(pairingLimit).map((_, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-md"
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-center text-gray-600 mt-3">
                  {pairingLimit} direct referrals, {maxDepth} levels deep
                </p>
              </div>

              <button
                onClick={handleSaveChainSettings}
                disabled={savingChain}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {savingChain ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Chain Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
