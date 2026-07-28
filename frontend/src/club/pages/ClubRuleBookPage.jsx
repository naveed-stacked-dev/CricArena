import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, FileText, File, FileImage, ExternalLink,
  Eye, Filter, ChevronDown, X, Calendar,
} from "lucide-react";
import clubService from "../services/clubService";

/* ─── Helper: pick an icon by mime type ─── */
function FileIcon({ mimeType, className = "w-5 h-5" }) {
  if (!mimeType) return <FileText className={`${className} text-gray-400`} />;
  if (mimeType.startsWith("image/")) return <FileImage className={`${className} text-blue-400`} />;
  if (mimeType === "application/pdf") return <File className={`${className} text-red-400`} />;
  return <FileText className={`${className} text-gray-400`} />;
}

/* ─── Full-screen document viewer overlay ─── */
function DocViewer({ doc, onClose }) {
  if (!doc) return null;
  const mime = doc.mimeType || "";
  const url = doc.fileUrl || "";

  let viewer;
  if (mime.startsWith("image/")) {
    viewer = (
      <div className="flex items-center justify-center h-full p-4">
        <img src={url} alt={doc.title} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
      </div>
    );
  } else if (mime === "application/pdf" || mime === "text/plain") {
    viewer = <iframe src={url} title={doc.title} className="w-full h-full border-0 rounded-b-2xl" />;
  } else if (
    mime === "application/msword" ||
    mime.includes("wordprocessingml") ||
    mime.includes("spreadsheetml")
  ) {
    viewer = (
      <iframe
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
        title={doc.title}
        className="w-full h-full border-0 rounded-b-2xl"
      />
    );
  } else {
    viewer = (
      <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: "var(--club-text-muted)" }}>
        <FileText className="w-16 h-16 opacity-20" />
        <p className="text-sm">Preview not available for this file type.</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
          style={{ borderColor: "var(--club-primary)", color: "var(--club-primary)" }}
        >
          <ExternalLink className="w-4 h-4" /> Open in new tab
        </a>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl flex flex-col rounded-2xl overflow-hidden"
          style={{ height: "90vh", backgroundColor: "var(--club-surface)", border: "1px solid var(--club-border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--club-border)" }}>
            <div className="flex items-center gap-3 min-w-0">
              <FileIcon mimeType={mime} />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: "var(--club-text-main)" }}>{doc.title}</p>
                {doc.description && (
                  <p className="text-xs truncate" style={{ color: "var(--club-text-muted)" }}>{doc.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                style={{ borderColor: "var(--club-border)", color: "var(--club-text-muted)" }}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:opacity-70"
                style={{ color: "var(--club-text-muted)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Viewer */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            {viewer}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Main Page ─── */
export default function ClubRuleBookPage() {
  const { club, tournaments } = useOutletContext();
  const clubId = club?._id || club?.id;

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournamentId, setSelectedTournamentId] = useState("all");
  const [viewDoc, setViewDoc] = useState(null);

  useEffect(() => {
    if (!clubId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await clubService.getDocuments(clubId);
        const all = res.data?.data || res.data || [];
        // Filter to only rulebook category
        setDocs(Array.isArray(all) ? all.filter((d) => d.category === "rulebook") : []);
      } catch { /* handled */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [clubId]);

  const filtered = docs.filter((d) => {
    if (selectedTournamentId === "all") return true;
    return (d.tournamentId?._id || d.tournamentId) === selectedTournamentId;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--club-text-main)" }}>
            <BookOpen className="w-5 h-5" style={{ color: "var(--club-primary)" }} />
            Rule Book
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--club-text-muted)" }}>
            Official rules and regulations for {club?.name}
          </p>
        </div>

        {/* Season / Tournament Filter */}
        {tournaments?.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Filter by Season:</span>
            <div className="relative">
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs font-bold focus:outline-none focus:ring-2 transition-all cursor-pointer shadow-sm hover:border-slate-300"
                style={{ color: "var(--club-text-main)" }}
              >
                <option value="all">All Seasons</option>
                {tournaments.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-surface p-16 text-center"
        >
          <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-20" style={{ color: "var(--club-text-muted)" }} />
          <p className="font-semibold" style={{ color: "var(--club-text-muted)" }}>No rule books found</p>
          <p className="text-sm mt-1" style={{ color: "var(--club-text-muted)" }}>
            {selectedTournamentId !== "all" ? "Try selecting a different season." : "Rule books will appear here once uploaded."}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((doc, i) => (
            <motion.div
              key={doc._id || i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="glass-card p-4 flex flex-col gap-3 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setViewDoc(doc)}
            >
              {/* Icon + Title */}
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "color-mix(in srgb, var(--club-primary) 12%, transparent)" }}
                >
                  <FileIcon mimeType={doc.mimeType} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight" style={{ color: "var(--club-text-main)" }}>{doc.title}</p>
                  {doc.description && (
                    <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--club-text-muted)" }}>{doc.description}</p>
                  )}
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: "var(--club-border)" }}>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--club-text-muted)" }}>
                  <Calendar className="w-3 h-3" />
                  {doc.tournamentId?.name ? (
                    <span className="truncate max-w-[100px]">{doc.tournamentId.name}</span>
                  ) : (
                    <span>General</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setViewDoc(doc); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                    style={{ background: "color-mix(in srgb, var(--club-primary) 10%, transparent)", color: "var(--club-primary)" }}
                  >
                    <Eye className="w-3 h-3" /> View
                  </button>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all hover:opacity-80"
                    style={{ borderColor: "var(--club-border)", color: "var(--club-text-muted)" }}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Document Viewer */}
      {viewDoc && <DocViewer doc={viewDoc} onClose={() => setViewDoc(null)} />}
    </div>
  );
}
