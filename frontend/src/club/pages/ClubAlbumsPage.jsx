import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Images, X, ChevronLeft, ChevronRight, ZoomIn, Calendar } from "lucide-react";
import clubService from "../services/clubService";

/* ─── Lightbox ─── */
function Lightbox({ images, index, onClose, onPrev, onNext }) {
  const img = images[index];
  if (!img) return null;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
        onClick={onClose}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Prev */}
        {index > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 md:left-8 w-12 h-12 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all z-10"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        {/* Image */}
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-[90vw] max-h-[85vh] flex flex-col gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={img.url || img.imageUrl}
            alt={img.caption || "Photo"}
            className="object-contain rounded-2xl shadow-2xl max-h-[78vh]"
            style={{ maxWidth: "90vw" }}
          />
          {img.caption && (
            <p className="text-center text-sm text-white/70 font-medium px-4">{img.caption}</p>
          )}
          <p className="text-center text-xs text-white/40">
            {index + 1} / {images.length}
          </p>
        </motion.div>

        {/* Next */}
        {index < images.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 md:right-8 w-12 h-12 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all z-10"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Main Albums Page ─── */
export default function ClubAlbumsPage() {
  const { club } = useOutletContext();
  const clubId = club?._id || club?.id;

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    if (!clubId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await clubService.getGallery(clubId, { limit: 200 });
        const data = res.data?.data || res.data || [];
        setImages(Array.isArray(data) ? data : []);
      } catch { /* handled */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [clubId]);

  const openLightbox = (i) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex((i) => Math.max(0, i - 1));
  const nextImage = () => setLightboxIndex((i) => Math.min(images.length - 1, i + 1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--club-text-main)" }}>
          <Images className="w-5 h-5" style={{ color: "var(--club-primary)" }} />
          Albums
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--club-text-muted)" }}>
          Photo gallery for {club?.name}
        </p>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-surface p-16 text-center"
        >
          <Images className="w-14 h-14 mx-auto mb-4 opacity-20" style={{ color: "var(--club-text-muted)" }} />
          <p className="font-semibold" style={{ color: "var(--club-text-muted)" }}>No photos yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--club-text-muted)" }}>Photos will appear here once uploaded.</p>
        </motion.div>
      ) : (
        <>
          {/* Stats bar */}
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--club-text-muted)" }}>
            <span className="flex items-center gap-1">
              <Images className="w-3.5 h-3.5" />
              {images.length} photo{images.length !== 1 ? "s" : ""}
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            {images.map((img, i) => (
              <motion.div
                key={img._id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ scale: 1.03, zIndex: 10 }}
                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                style={{ border: "1px solid var(--club-border)" }}
                onClick={() => openLightbox(i)}
              >
                <img
                  src={img.url || img.imageUrl}
                  alt={img.caption || "Photo"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  <ZoomIn className="w-7 h-7 text-white mb-1" />
                  {img.caption && (
                    <p className="text-[10px] text-white/80 text-center px-2 leading-tight font-medium line-clamp-2">
                      {img.caption}
                    </p>
                  )}
                </div>
                {/* Date badge */}
                {img.createdAt && (
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] text-white/80 opacity-0 group-hover:opacity-100 transition-all"
                    style={{ background: "rgba(0,0,0,0.6)" }}>
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(img.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </div>
  );
}
