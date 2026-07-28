import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, TrendingUp, Activity, Award, Target, Zap,
  Star, Circle, Dices, Users, Filter, ChevronDown, Shield,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import clubService from "../services/clubService";

/* ─── Leaderboard row ─── */
function LeaderRow({ rank, name, team, value, themeColor }) {
  const rankColors = ["#f59e0b", "#94a3b8", "#b45309"];
  const rankBg = rankColors[rank - 1] || `${themeColor}20`;
  const rankColor = rank <= 3 ? "#fff" : themeColor;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 transition-colors hover:bg-white/[0.03]"
      style={{ borderColor: "var(--club-border)" }}>
      <div className="flex items-center gap-3">
        <span
          className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: rankBg, color: rankColor }}
        >
          {rank}
        </span>
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--club-text-main)" }}>{name}</p>
          {team && <p className="text-[10px]" style={{ color: "var(--club-text-muted)" }}>{team}</p>}
        </div>
      </div>
      <span className="font-bold text-base" style={{ color: themeColor }}>{value}</span>
    </div>
  );
}

/* ─── Stat card with leaderboard ─── */
function StatCard({ icon: Icon, title, data = [], valueKey, valueFormatter, iconColor, themeColor }) {
  const empty = !data || data.length === 0;
  return (
    <div className="glass-surface overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--club-border)" }}>
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: iconColor || themeColor }} />
        <span className="text-sm font-semibold" style={{ color: "var(--club-text-main)" }}>{title}</span>
      </div>
      {empty ? (
        <div className="py-10 text-center" style={{ color: "var(--club-text-muted)" }}>
          <Target className="w-7 h-7 mx-auto mb-2 opacity-20" />
          <p className="text-xs">No data available yet</p>
        </div>
      ) : (
        data.slice(0, 5).map((entry, idx) => {
          const rawVal = typeof valueKey === "function" ? valueKey(entry) : entry[valueKey];
          const displayVal = valueFormatter ? valueFormatter(rawVal, entry) : rawVal;
          return (
            <LeaderRow
              key={idx}
              rank={idx + 1}
              name={entry.player?.name || "Unknown"}
              team={entry.player?.team?.name}
              value={displayVal ?? "—"}
              themeColor={themeColor}
            />
          );
        })
      )}
    </div>
  );
}

/* ─── Bar chart card ─── */
function ChartCard({ title, icon: Icon, data, dataKey, color, themeColor }) {
  return (
    <div className="glass-surface overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--club-border)" }}>
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: color }} />
        <span className="text-sm font-semibold" style={{ color: "var(--club-text-main)" }}>{title}</span>
      </div>
      <div className="p-4">
        {!data || data.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center" style={{ color: "var(--club-text-muted)" }}>
            <Icon className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm">No data yet</p>
          </div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "var(--club-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "var(--club-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{
                    backgroundColor: "var(--club-surface)",
                    border: "1px solid var(--club-border)",
                    borderRadius: "10px",
                    color: "var(--club-text-main)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
                  {data.map((_, i) => <Cell key={i} fill={color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { key: "batting", label: "Batting" },
  { key: "bowling", label: "Bowling" },
  { key: "fielding", label: "Fielding" },
  { key: "charts", label: "Charts" },
];

/* ─── Main Analytics Page ─── */
export default function ClubAnalyticsPage() {
  const { club, tournaments } = useOutletContext();
  const clubId = club?._id || club?.id;
  const themeColor = "var(--club-primary)";

  const [selectedTournamentId, setSelectedTournamentId] = useState("all");
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("batting");

  useEffect(() => {
    if (!clubId) return;
    setLoading(true);
    const params = selectedTournamentId !== "all" ? { tournamentId: selectedTournamentId } : {};
    clubService.getLeaderboard(clubId, params)
      .then((res) => setLeaderboard(res.data?.data || res.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clubId, selectedTournamentId]);

  const topRunScorers = (leaderboard?.topScorers || []).slice(0, 5).map((p) => ({
    name: p.player?.name || "Unknown",
    runs: p.totalRuns || 0,
  }));
  const topWicketTakers = (leaderboard?.topWicketTakers || []).slice(0, 5).map((p) => ({
    name: p.player?.name || "Unknown",
    wickets: p.totalWickets || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--club-text-main)" }}>
            <BarChart3 className="w-5 h-5" style={{ color: "var(--club-primary)" }} />
            Analytics
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--club-text-muted)" }}>
            Club statistics and performance leaderboards
          </p>
        </div>

        {/* Tournament filter */}
        {tournaments?.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Tournament:</span>
            <div className="relative">
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs font-bold focus:outline-none transition-all cursor-pointer shadow-sm hover:border-slate-300"
                style={{ color: "var(--club-text-main)" }}
              >
                <option value="all">All Tournaments</option>
                {tournaments.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              activeTab === t.key
                ? { background: "var(--club-primary)", color: "#fff", boxShadow: "0 4px 14px var(--club-primary)33" }
                : { color: "var(--club-text-muted)", background: "transparent" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : !leaderboard ? (
        <div className="glass-surface p-16 text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--club-text-muted)" }} />
          <p className="font-medium" style={{ color: "var(--club-text-muted)" }}>No analytics data yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--club-text-muted)" }}>Data will appear once matches are scored</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "batting" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <StatCard icon={TrendingUp} title="Most Runs" iconColor="oklch(0.6 0.15 250)"
                  data={leaderboard?.topScorers} valueKey="totalRuns" themeColor={themeColor} />
                <StatCard icon={Award} title="Best Batting Average" iconColor="#10b981"
                  data={leaderboard?.bestBattingAverage} valueKey="battingAverage"
                  valueFormatter={(v) => v?.toFixed(2) ?? "—"} themeColor={themeColor} />
                <StatCard icon={Zap} title="Highest Score" iconColor="#f59e0b"
                  data={leaderboard?.highestScores} valueKey="highestScore" themeColor={themeColor} />
                <StatCard icon={Star} title="Most Fifties" iconColor="#8b5cf6"
                  data={leaderboard?.mostFifties} valueKey="fifties" themeColor={themeColor} />
                <StatCard icon={Star} title="Most Hundreds" iconColor="#ec4899"
                  data={leaderboard?.mostHundreds} valueKey="hundreds" themeColor={themeColor} />
                <StatCard icon={Circle} title="Most Sixes" iconColor="#ef4444"
                  data={leaderboard?.mostSixes} valueKey="sixes" themeColor={themeColor} />
              </div>
            )}

            {activeTab === "bowling" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <StatCard icon={Activity} title="Most Wickets" iconColor="#ef4444"
                  data={leaderboard?.topWicketTakers} valueKey="totalWickets" themeColor={themeColor} />
                <StatCard icon={Award} title="Best Bowling Average" iconColor="#10b981"
                  data={leaderboard?.bestBowlingAverage} valueKey="bowlingAverage"
                  valueFormatter={(v) => v?.toFixed(2) ?? "—"} themeColor={themeColor} />
                <StatCard icon={TrendingUp} title="Best Economy Rate" iconColor="#6366f1"
                  data={leaderboard?.bestEconomyRate} valueKey="economy"
                  valueFormatter={(v) => v?.toFixed(2) ?? "—"} themeColor={themeColor} />
                <StatCard icon={Dices} title="Most Dot Balls" iconColor="#f59e0b"
                  data={leaderboard?.mostDotBalls} valueKey="dotBallsBowled" themeColor={themeColor} />
                <StatCard icon={Zap} title="5-Wicket Hauls" iconColor="#ec4899"
                  data={leaderboard?.wicketHauls} valueKey="fiveWicketHauls" themeColor={themeColor} />
              </div>
            )}

            {activeTab === "fielding" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <StatCard icon={Users} title="Best Fielder (Total Dismissals)" iconColor="#10b981"
                  data={leaderboard?.bestFielders} valueKey="total" themeColor={themeColor} />
                <StatCard icon={Award} title="Top Performer (MVP)" iconColor="#f59e0b"
                  data={leaderboard?.mvp}
                  valueKey={(e) => e.mvpScore}
                  valueFormatter={(v) => v ? `${Math.round(v)} pts` : "—"}
                  themeColor={themeColor} />
              </div>
            )}

            {activeTab === "charts" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                  title="Top Run Scorers"
                  icon={TrendingUp}
                  data={topRunScorers}
                  dataKey="runs"
                  color="oklch(0.6 0.15 250)"
                  themeColor={themeColor}
                />
                <ChartCard
                  title="Top Wicket Takers"
                  icon={Activity}
                  data={topWicketTakers}
                  dataKey="wickets"
                  color="oklch(0.6 0.2 20)"
                  themeColor={themeColor}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
