import React, { useState } from "react";
import {
  Users,
  Briefcase,
  DollarSign,
  RefreshCcw,
  Sparkles,
  X,
  Loader2,
  TrendingUp,
  Calendar,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import type { PieLabelRenderProps } from "recharts";
import type {
  DashboardStats,
  ChartData,
  MonthlyTrend,
  SectorKey,
} from "../types";

interface StatCardProps {
  title: string;
  value?: string | number;
  growth?: number;
  icon: React.ReactNode;
}

const SECTOR_LABELS: Record<
  string,
  { cust: string; lead: string; rev: string }
> = {
  TURIZM: { cust: "Səyahətçi", lead: "Tur Paketi", rev: "Turizm Gəliri" },
  KURS: { cust: "Tələbə", lead: "Kurs Qeydiyyatı", rev: "Təhsil Gəliri" },
  EMLAK: { cust: "Alıcı", lead: "Mülk Satışı", rev: "Əmlak Dövriyyəsi" },
  AVTO: { cust: "Sürücü", lead: "Maşın Satışı", rev: "Satış Həcmi" },
  DEFAULT: { cust: "Müştəri", lead: "Satış Sifarişi", rev: "Ümumi Gəlir" },
};

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];
const LINE_COLORS = {
  revenue: "#FF4D4D",
  leads: "#FFC107",
  customers: "#4CAF50",
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ORG_ID = user?.organizationId;
  const sector = (user?.businessSector as SectorKey) || "DEFAULT";
  const labels = SECTOR_LABELS[sector] || SECTOR_LABELS.DEFAULT;

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- REACT QUERY ---
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["stats", ORG_ID],
    queryFn: () =>
      api.get(`/dashboard/stats/${ORG_ID}`).then((res) => res.data),
    enabled: !!ORG_ID,
  });

  const { data: statusData, isLoading: chartLoading } = useQuery<ChartData[]>({
    queryKey: ["charts", ORG_ID],
    queryFn: () =>
      api.get(`/dashboard/charts/${ORG_ID}`).then((res) => res.data),
    enabled: !!ORG_ID,
  });

  const { data: trendData, isLoading: trendLoading } = useQuery<MonthlyTrend[]>(
    {
      queryKey: ["trends", ORG_ID],
      queryFn: () =>
        api.get(`/dashboard/trends/${ORG_ID}`).then((res) => res.data),
      enabled: !!ORG_ID,
    },
  );

  const handleAIAnalysis = async () => {
    setIsAiLoading(true);
    const tId = toast.loading("AI datanı analiz edir...");
    try {
      const res = await api.get(`/dashboard/ai-analysis/${ORG_ID}`);
      setAiInsight(res.data.insight);
      toast.success("Analiz hazırdır!", { id: tId });
    } catch {
      toast.error("AI sisteminə qoşulmaq mümkün olmadı", { id: tId });
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
  }: PieLabelRenderProps) => {
    const safeMidAngle = Number(midAngle) || 0;
    const safeOuterRadius = Number(outerRadius) || 0;
    const safeCx = Number(cx) || 0;
    const safeCy = Number(cy) || 0;
    const safePercent = Number(percent) || 0;

    const RADIAN = Math.PI / 180;
    const x =
      safeCx + (safeOuterRadius + 30) * Math.cos(-RADIAN * safeMidAngle);
    const y =
      safeCy + (safeOuterRadius + 30) * Math.sin(-RADIAN * safeMidAngle);

    return (
      <text
        x={x}
        y={y}
        fill="#64748b"
        textAnchor={x > safeCx ? "start" : "end"}
        fontSize={11}
        fontStyle="italic"
        fontWeight="900"
      >
        {`${name}: ${(safePercent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (statsLoading || chartLoading || trendLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="animate-spin size-12 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic flex items-center">
            <Zap className="mr-3 text-indigo-600 fill-indigo-600" /> Nexa
            Intelligence
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center">
            <Calendar className="size-3 mr-2" /> May 2026 • {user?.companyName}{" "}
            Hesabatı
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["stats"] })
            }
            className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-90"
          >
            <RefreshCcw size={20} className="text-slate-600" />
          </button>

          <button
            onClick={handleAIAnalysis}
            disabled={isAiLoading}
            className="flex items-center bg-indigo-600 text-white px-8 py-4 rounded-[22px] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
          >
            {isAiLoading ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Sparkles className="mr-2" size={16} />
            )}
            AI Analiz Al
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard
          title={`Ümumi ${labels.cust}`}
          value={stats?.totalCustomers}
          growth={stats?.customerGrowth}
          icon={<Users className="text-blue-500" />}
        />
        <StatCard
          title={`Aktiv ${labels.lead}`}
          value={stats?.totalLeads}
          growth={stats?.leadsGrowth}
          icon={<Briefcase className="text-amber-500" />}
        />
        <StatCard
          title={labels.rev}
          value={`$${stats?.totalExpectedRevenue?.toLocaleString()}`}
          growth={stats?.revenueGrowth}
          icon={<DollarSign className="text-emerald-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white py-8 px-4 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="text-lg font-black text-slate-700 uppercase tracking-tighter italic">
              12 Aylıq Biznes Trendi
            </h3>
            <div className="flex space-x-3">
              <LegendBadge color={LINE_COLORS.revenue} label="Gəlir" />
              <LegendBadge color={LINE_COLORS.customers} label={labels.cust} />
            </div>
          </div>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={true}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: "bold" }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: "bold" }}
                />
                <YAxis yAxisId="right" orientation="right" hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "20px",
                    border: "none",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    padding: "15px",
                  }}
                />
                <Line
                  yAxisId="left"
                  name="Gəlir"
                  type="monotone"
                  dataKey="revenue"
                  stroke={LINE_COLORS.revenue}
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#fff", strokeWidth: 3 }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  yAxisId="right"
                  name={labels.cust}
                  type="monotone"
                  dataKey="customers"
                  stroke={LINE_COLORS.customers}
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#fff", strokeWidth: 3 }}
                />
                <Line
                  yAxisId="right"
                  name={labels.lead}
                  type="monotone"
                  dataKey="leads"
                  stroke={LINE_COLORS.leads}
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#fff", strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white py-8 px-4 rounded-[40px] shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-700 uppercase tracking-tighter italic mb-8 px-2">
            Status Bölgüsü
          </h3>
          <div className="h-75 w-full ">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={renderLabel}
                  outerRadius={110}
                  dataKey="value"
                  strokeWidth={5}
                >
                  {statusData?.map((_entry: ChartData, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={12}
                  wrapperStyle={{
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {aiInsight && (
          <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiInsight(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-4xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-indigo-50"
            >
              <div className="bg-linear-to-r from-indigo-600 to-violet-700 p-6 text-white shrink-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                      <Sparkles size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">
                        Nexa AI Analiz
                      </h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 italic">
                        Strateji Məsləhətlər
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAiInsight(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                {aiInsight
                  .split("[")
                  .filter(Boolean)
                  .map((section, idx) => {
                    const [title, ...content] = section.split("]");
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className="relative pl-6 border-l-2 border-slate-100 "
                      >
                        <div className="absolute -left-1.25 top-0 size-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">
                          {title}
                        </h4>
                        <p className="text-slate-600 font-bold leading-relaxed text-sm italic">
                          {content.join("]")}
                        </p>
                      </motion.div>
                    );
                  })}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setAiInsight(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-indigo-600 transition-all active:scale-95"
                >
                  Anladım, Tətbiq Edəcəm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, growth, icon }) => {
  const isPositive = (growth ?? 0) >= 0;
  return (
    <div className="relative  p-8 rounded-[35px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
      <div className="flex items-center space-x-5">
        <div className="p-4 bg-slate-200 rounded-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {title}
          </p>
          <h4 className="text-3xl font-black text-slate-800 mt-1 tracking-tighter">
            {value || 0}
          </h4>
        </div>
      </div>
      <div
        className={`absolute top-5 right-5 flex items-center text-xs font-black px-3 py-1 rounded-full ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
      >
        <TrendingUp
          size={14}
          className={`mr-1 ${isPositive ? "" : "rotate-180"}`}
        />
        {Math.abs(growth ?? 0).toFixed(1)}%
      </div>
    </div>
  );
};

const LegendBadge = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center space-x-2">
    <div
      className="size-3 rounded-full"
      style={{ backgroundColor: color }}
    ></div>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
      {label}
    </span>
  </div>
);

export default Dashboard;
