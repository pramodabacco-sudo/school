// client/src/superAdmin/pages/IdCards/IdCardManagement.jsx
import React, { useEffect, useState, useRef } from "react";
import { getToken } from "../../../auth/storage";
import {
  Upload, LayoutTemplate, ShoppingBag, Trash2,
  RefreshCw, CheckCircle, Clock, Truck, Package,
  XCircle, Eye, ShoppingCart, X
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const STATUS_CONFIG = {
  PENDING:    { label: "Pending",    color: "#f59e0b", bg: "#fffbeb" },
  CONFIRMED:  { label: "Confirmed",  color: "#3b82f6", bg: "#eff6ff" },
  PROCESSING: { label: "Processing", color: "#8b5cf6", bg: "#f5f3ff" },
  DISPATCHED: { label: "Dispatched", color: "#f97316", bg: "#fff7ed" },
  DELIVERED:  { label: "Delivered",  color: "#10b981", bg: "#f0fdf4" },
  CANCELLED:  { label: "Cancelled",  color: "#ef4444", bg: "#fef2f2" },
};

const COLORS = {
  primary:   "#1e3a5f",
  secondary: "#6b7280",
  border:    "#e5e7eb",
  bgSoft:    "#f9fafb",
  accent:    "#3b82f6",
};

export default function IdCardManagement() {
  const [tab, setTab]             = useState("templates");
  const [templates, setTemplates] = useState([]);
  const [orders, setOrders]       = useState([]);
  const [schools, setSchools]                   = useState([]);
  const [schoolClasses, setSchoolClasses]       = useState([]);
  const [loadingClasses, setLoadingClasses]     = useState(false);
  const [expandedClass, setExpandedClass]       = useState(null);
  const [classStudents, setClassStudents]       = useState({});
  const [loadingStudents, setLoadingStudents]   = useState({});
  const [loading, setLoading]     = useState(false);

  // Modals
  const [uploadModal, setUploadModal]   = useState(false);
  const [orderModal, setOrderModal]     = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Upload form
  const [uploadForm, setUploadForm]   = useState({ title: "", description: "", file: null });
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef();

  // Order form
  const [orderForm, setOrderForm] = useState({
    schoolId:      "",
    templateId:    "",
    contactName:   "",
    contactPhone:  "",
    contactEmail:  "",
    notes:         "",
    classDetails:  [{ className: "", studentCount: "" }],
  });
  const [orderError, setOrderError]   = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  // ── Fetch templates ──────────────────────────────────────────────────────
  const fetchTemplates = async (schoolId = null) => {
    setLoading(true);
    try {
      const url = schoolId ? `${API}/api/id-cards/templates?schoolId=${schoolId}` : `${API}/api/id-cards/templates`;
      const res  = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Fetch orders ─────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/id-cards/orders`, { headers: authHeaders() });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Fetch schools for order dropdown ─────────────────────────────────────
  const fetchSchools = async () => {
    try {
      const res  = await fetch(`${API}/api/schools`, { headers: authHeaders() });
      const data = await res.json();
      setSchools(data.schools || data || []);
    } catch (err) { console.error(err); }
  };

  // ── Fetch classes for selected school ────────────────────────────────────
  const fetchClassesForSchool = async (schoolId) => {
    if (!schoolId) { setSchoolClasses([]); return; }
    setLoadingClasses(true);
    try {
      const res  = await fetch(`${API}/api/class-sections?schoolId=${schoolId}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setSchoolClasses(data.classSections || data.classes || data || []);
    } catch (err) { console.error(err); setSchoolClasses([]); }
    finally { setLoadingClasses(false); }
  };

  useEffect(() => {
    if (tab === "templates") fetchTemplates();
    else                     fetchOrders();
  }, [tab]);

  // ── Upload template ──────────────────────────────────────────────────────
  const handleUpload = async () => {
    setUploadError("");
    if (!uploadForm.file)  { setUploadError("Please select an image."); return; }
    if (!uploadForm.title) { setUploadError("Title is required."); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file",        uploadForm.file);
      fd.append("title",       uploadForm.title);
      fd.append("description", uploadForm.description);
      const res  = await fetch(`${API}/api/id-cards/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadModal(false);
      setUploadForm({ title: "", description: "", file: null });
      fetchTemplates();
    } catch (err) { setUploadError(err.message); }
    finally { setUploading(false); }
  };

  // ── Delete template ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm("Delete this template?")) return;
    try {
      await fetch(`${API}/api/id-cards/templates/${id}`, { method: "DELETE", headers: authHeaders() });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) { console.error(err); }
  };

  // ── Fetch students for a class (for individual selection) ───────────────
  const fetchStudentsForClass = async (cls) => {
    if (classStudents[cls.id]) return; // already loaded
    setLoadingStudents((p) => ({ ...p, [cls.id]: true }));
    try {
      const res  = await fetch(
        `${API}/api/students?classSectionId=${cls.id}&schoolId=${orderForm.schoolId}&limit=200&page=1`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      setClassStudents((p) => ({ ...p, [cls.id]: data.students || [] }));
    } catch (err) { console.error(err); }
    finally { setLoadingStudents((p) => ({ ...p, [cls.id]: false })); }
  };

  // ── Order form helpers ───────────────────────────────────────────────────
  const openOrderModal = () => {
    fetchSchools();
    setSchoolClasses([]);
    setExpandedClass(null);
    setClassStudents({});
    setLoadingStudents({});
    setOrderForm({
      schoolId: "", templateId: "", contactName: "",
      contactPhone: "", contactEmail: "", notes: "",
      classDetails: [],
    });
    setOrderError("");
    setOrderSuccess(false);
    setOrderModal(true);
  };

  const addClassRow = () =>
    setOrderForm((p) => ({ ...p, classDetails: [...p.classDetails, { className: "", studentCount: "" }] }));

  const removeClassRow = (i) =>
    setOrderForm((p) => ({ ...p, classDetails: p.classDetails.filter((_, idx) => idx !== i) }));

  const updateClassRow = (i, field, value) =>
    setOrderForm((p) => {
      const rows = [...p.classDetails];
      rows[i] = { ...rows[i], [field]: value };
      return { ...p, classDetails: rows };
    });

  const totalCards = orderForm.classDetails.reduce(
    (sum, r) => sum + (Number(r.studentCount) || 0), 0
  );

  // ── Place order ──────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setOrderError("");
    if (!orderForm.schoolId) { setOrderError("Please select a school."); return; }
    const validClasses = orderForm.classDetails.filter((r) => r.className && Number(r.studentCount) > 0);
    if (validClasses.length === 0) { setOrderError("Add at least one class with student count."); return; }

    setPlacingOrder(true);
    try {
      const res = await fetch(`${API}/api/id-cards/orders/place`, {
        method:  "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId:     orderForm.schoolId,
          templateId:   orderForm.templateId || null,
          contactName:  orderForm.contactName  || null,
          contactPhone: orderForm.contactPhone || null,
          contactEmail: orderForm.contactEmail || null,
          notes:        orderForm.notes        || null,
          classDetails: validClasses,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");
      setOrderSuccess(true);
      fetchOrders();
      setTimeout(() => { setOrderModal(false); setOrderSuccess(false); }, 2000);
    } catch (err) { setOrderError(err.message); }
    finally { setPlacingOrder(false); }
  };

  // ── Update order status ──────────────────────────────────────────────────
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await fetch(`${API}/api/id-cards/orders/${orderId}/status`, {
        method:  "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen p-3 sm:p-6" style={{ background: COLORS.bgSoft }}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold" style={{ color: COLORS.primary }}>ID Card Management</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: COLORS.secondary }}>Manage templates and school orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tab === "templates" && (
            <button onClick={() => setUploadModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white"
              style={{ background: COLORS.accent }}>
              <Upload size={13} /> Upload Template
            </button>
          )}
          <button onClick={openOrderModal}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white"
            style={{ background: "#10b981" }}>
            <ShoppingCart size={13} /> Place Order
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#e5e7eb" }}>
        {[{ key: "templates", label: "Templates", icon: LayoutTemplate },
          { key: "orders",    label: "Orders",    icon: ShoppingBag }].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === key ? "#fff" : "transparent",
              color:      tab === key ? COLORS.primary : COLORS.secondary,
              boxShadow:  tab === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Templates Tab ── */}
      {tab === "templates" && (
        loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw size={20} className="animate-spin" style={{ color: COLORS.accent }} />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 rounded-2xl"
            style={{ border: `2px dashed ${COLORS.border}`, background: "#fff" }}>
            <LayoutTemplate size={40} style={{ color: COLORS.border }} />
            <p className="mt-3 font-semibold" style={{ color: COLORS.secondary }}>No templates yet</p>
            <p className="text-sm mt-1" style={{ color: COLORS.secondary }}>Upload an ID card design template</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="rounded-2xl overflow-hidden shadow-sm"
                style={{ background: "#fff", border: `1px solid ${COLORS.border}` }}>
                <div className="relative" style={{ aspectRatio: "85/54", background: "#f3f4f6" }}>
                  {t.imageUrl
                    ? <img src={t.imageUrl} alt={t.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <LayoutTemplate size={32} style={{ color: COLORS.border }} />
                      </div>}
                  <button onClick={() => setPreviewTemplate(t)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <Eye size={13} color="#fff" />
                  </button>
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm truncate" style={{ color: COLORS.primary }}>{t.title}</p>
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold mt-1"
                    style={{
                      background: t.isDefault ? "#eff6ff" : "#f0fdf4",
                      color:      t.isDefault ? "#3b82f6" : "#15803d",
                    }}>
                    {t.isDefault ? "🌐 Platform Default" : "⭐ Your Design"}
                  </span>
                  {t.description && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: COLORS.secondary }}>{t.description}</p>}
                  <p className="text-xs mt-2" style={{ color: COLORS.secondary }}>
                    {new Date(t.uploadedAt).toLocaleDateString("en-IN")}
                  </p>
                  <button onClick={() => handleDelete(t.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold mt-3"
                    style={{ background: "#fef2f2", color: "#ef4444" }}>
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Orders Tab ── */}
      {tab === "orders" && (
        loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw size={20} className="animate-spin" style={{ color: COLORS.accent }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 rounded-2xl"
            style={{ border: `2px dashed ${COLORS.border}`, background: "#fff" }}>
            <ShoppingBag size={40} style={{ color: COLORS.border }} />
            <p className="mt-3 font-semibold" style={{ color: COLORS.secondary }}>No orders yet</p>
            <button onClick={openOrderModal}
              className="mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "#10b981" }}>
              Place First Order
            </button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-sm"
            style={{ background: "#fff", border: `1px solid ${COLORS.border}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 800 }}>
                <thead>
                  <tr style={{ background: COLORS.bgSoft, borderBottom: `1px solid ${COLORS.border}` }}>
                    {["School", "Template", "Classes & Count", "Total Cards", "Contact", "Ordered On", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-bold text-xs" style={{ color: COLORS.secondary }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const sc      = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                    const classes = Array.isArray(order.classDetails) ? order.classDetails : [];
                    return (
                      <tr key={order.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td className="px-4 py-3">
                          <p className="font-semibold" style={{ color: COLORS.primary }}>{order.schoolName}</p>
                        </td>
                        <td className="px-4 py-3">
                          {order.template
                            ? <div className="flex items-center gap-2">
                                {order.template.imageUrl && <img src={order.template.imageUrl} alt="" className="w-10 h-6 object-cover rounded" />}
                                <span className="text-xs font-medium" style={{ color: COLORS.primary }}>{order.template.title}</span>
                              </div>
                            : <span className="text-xs" style={{ color: COLORS.secondary }}>No template</span>}
                        </td>
                        <td className="px-4 py-3" style={{ maxWidth: 200 }}>
                          <div className="flex flex-wrap gap-1">
                            {classes.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: "#eff6ff", color: "#3b82f6" }}>
                                {c.className} ({c.studentCount})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-lg" style={{ color: COLORS.primary }}>{order.totalCards}</span>
                        </td>
                        <td className="px-4 py-3">
                          {order.contactName
                            ? <><p className="text-xs font-medium" style={{ color: COLORS.primary }}>{order.contactName}</p>
                               <p className="text-xs" style={{ color: COLORS.secondary }}>{order.contactPhone || order.contactEmail || ""}</p></>
                            : <span className="text-xs" style={{ color: COLORS.secondary }}>—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: COLORS.secondary }}>
                          {new Date(order.orderedAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <select value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="text-xs font-bold rounded-full px-3 py-1 appearance-none cursor-pointer"
                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}44`, outline: "none" }}>
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <option key={key} value={key}>{cfg.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Upload Modal ── */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#fff" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.primary }}>Upload ID Card Template</h2>
            {uploadError && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "#fef2f2", color: "#ef4444" }}>{uploadError}</div>}
            <div onClick={() => fileInputRef.current?.click()}
              className="mb-4 rounded-xl flex flex-col items-center justify-center cursor-pointer"
              style={{ border: `2px dashed ${uploadForm.file ? COLORS.accent : COLORS.border}`, padding: "24px", background: uploadForm.file ? "#eff6ff" : COLORS.bgSoft }}>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => setUploadForm((p) => ({ ...p, file: e.target.files[0] }))} />
              {uploadForm.file
                ? <><img src={URL.createObjectURL(uploadForm.file)} alt="Preview" className="max-h-32 rounded-lg object-contain mb-2" />
                    <p className="text-xs font-semibold" style={{ color: COLORS.accent }}>{uploadForm.file.name}</p></>
                : <><Upload size={28} style={{ color: COLORS.border }} />
                    <p className="text-sm mt-2 font-semibold" style={{ color: COLORS.secondary }}>Click to select image</p>
                    <p className="text-xs mt-1" style={{ color: COLORS.secondary }}>JPEG, PNG, WebP — max 5 MB</p></>}
            </div>
            <input type="text" placeholder="Template title *" value={uploadForm.title}
              onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full mb-3 px-4 py-2.5 rounded-xl text-sm"
              style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
            <textarea placeholder="Description (optional)" value={uploadForm.description}
              onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
              rows={2} className="w-full mb-4 px-4 py-2.5 rounded-xl text-sm resize-none"
              style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
            <div className="flex gap-3">
              <button onClick={() => { setUploadModal(false); setUploadError(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.secondary }}>Cancel</button>
              <button onClick={handleUpload} disabled={uploading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: uploading ? "#93c5fd" : COLORS.accent }}>
                {uploading ? "Uploading…" : "Upload Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Modal ── */}
      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-2xl rounded-2xl" style={{ background: "#fff", maxHeight: "90vh", overflowY: "auto" }}>

            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4"
              style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: COLORS.primary }}>Place ID Card Order</h2>
                <p className="text-sm" style={{ color: COLORS.secondary }}>Select school, template and enter class details</p>
              </div>
              <button onClick={() => setOrderModal(false)} className="p-2 rounded-lg"
                style={{ background: COLORS.bgSoft }}><X size={16} /></button>
            </div>

            <div className="p-6 space-y-4">
              {orderSuccess && (
                <div className="p-4 rounded-xl text-sm font-semibold flex items-center gap-2"
                  style={{ background: "#f0fdf4", color: "#15803d" }}>
                  <CheckCircle size={16} /> Order placed successfully!
                </div>
              )}
              {orderError && (
                <div className="p-3 rounded-xl text-sm" style={{ background: "#fef2f2", color: "#ef4444" }}>
                  {orderError}
                </div>
              )}

              {/* School */}
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: COLORS.primary }}>School *</label>
                <select value={orderForm.schoolId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setOrderForm((p) => ({ ...p, schoolId: sid, classDetails: [], templateId: '' }));
                    fetchClassesForSchool(sid);
                    if (sid) fetchTemplates(sid);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={{ border: `1px solid ${COLORS.border}`, outline: "none" }}>
                  <option value="">Select a school</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Template */}
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: COLORS.primary }}>Template (optional)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div onClick={() => setOrderForm((p) => ({ ...p, templateId: "" }))}
                    className="rounded-xl p-2 cursor-pointer text-center text-xs font-semibold"
                    style={{
                      border: `2px solid ${!orderForm.templateId ? COLORS.accent : COLORS.border}`,
                      background: !orderForm.templateId ? "#eff6ff" : "#fff",
                      color: !orderForm.templateId ? COLORS.accent : COLORS.secondary,
                    }}>
                    No template
                  </div>
                  {templates.map((t) => (
                    <div key={t.id} onClick={() => setOrderForm((p) => ({ ...p, templateId: t.id }))}
                      className="rounded-xl overflow-hidden cursor-pointer"
                      style={{ border: `2px solid ${orderForm.templateId === t.id ? COLORS.accent : COLORS.border}` }}>
                      {t.imageUrl && <img src={t.imageUrl} alt={t.title} className="w-full h-16 object-cover" />}
                      <p className="text-xs font-semibold text-center py-1 px-2 truncate"
                        style={{ color: orderForm.templateId === t.id ? COLORS.accent : COLORS.primary }}>
                        {t.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold" style={{ color: COLORS.primary }}>
                    Classes & Student Count *
                  </label>
                  {orderForm.schoolId && !loadingClasses && schoolClasses.length > 0 && (
                    <button onClick={() => {
                      const all = schoolClasses.map((c) => ({
                        className:    c.name,
                        studentCount: c._count?.studentEnrollments || 0,
                        studentIds:   [],
                      }));
                      setOrderForm((p) => ({ ...p, classDetails: all }));
                    }}
                      className="px-3 py-1 rounded-lg text-xs font-bold"
                      style={{ background: "#eff6ff", color: COLORS.accent }}>
                      + Add All Classes
                    </button>
                  )}
                </div>

                {/* No school selected */}
                {!orderForm.schoolId && (
                  <p className="text-xs py-3 text-center rounded-xl"
                    style={{ background: COLORS.bgSoft, color: COLORS.secondary }}>
                    Select a school first to see available classes
                  </p>
                )}

                {/* Loading classes */}
                {orderForm.schoolId && loadingClasses && (
                  <p className="text-xs py-3 text-center rounded-xl"
                    style={{ background: COLORS.bgSoft, color: COLORS.secondary }}>
                    Loading classes…
                  </p>
                )}

                {/* Class rows */}
                {!loadingClasses && schoolClasses.length > 0 && (
                  <div className="space-y-2">
                    {schoolClasses.map((cls) => {
                      const existing     = orderForm.classDetails.find((r) => r.className === cls.name);
                      const isSelected   = !!existing;
                      const isExpanded   = expandedClass === cls.id;
                      const students     = classStudents[cls.id] || [];
                      const isLoadingStu = loadingStudents[cls.id];
                      // selectedStudentIds for this class
                      const selectedIds  = new Set(existing?.studentIds || []);
                      const totalInClass = cls._count?.studentEnrollments || 0;

                      return (
                        <div key={cls.id} className="rounded-xl overflow-hidden"
                          style={{ border: `1px solid ${isSelected ? COLORS.accent : COLORS.border}` }}>

                          {/* ── Class row ── */}
                          <div className="flex items-center gap-3 p-3"
                            style={{ background: isSelected ? "#eff6ff" : "#fff" }}>
                            {/* Checkbox */}
                            <input type="checkbox" checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Auto-fill with all students
                                  const allIds = (classStudents[cls.id] || []).map(s => s.id);
                                  setOrderForm((p) => ({
                                    ...p,
                                    classDetails: [...p.classDetails, {
                                      className:    cls.name,
                                      studentCount: totalInClass,
                                      studentIds:   allIds,
                                    }],
                                  }));
                                  // Load students in background
                                  if (!classStudents[cls.id]) fetchStudentsForClass(cls);
                                } else {
                                  setOrderForm((p) => ({
                                    ...p,
                                    classDetails: p.classDetails.filter((r) => r.className !== cls.name),
                                  }));
                                  if (expandedClass === cls.id) setExpandedClass(null);
                                }
                              }}
                              className="w-4 h-4 cursor-pointer accent-blue-500 flex-shrink-0"
                            />

                            {/* Class name */}
                            <span className="flex-1 text-sm font-semibold"
                              style={{ color: isSelected ? COLORS.accent : COLORS.primary }}>
                              {cls.name}
                            </span>

                            {/* Auto count badge */}
                            {isSelected && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: "#dbeafe", color: COLORS.accent }}>
                                {existing.studentCount} students
                              </span>
                            )}
                            {!isSelected && totalInClass > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: COLORS.bgSoft, color: COLORS.secondary }}>
                                {totalInClass} students
                              </span>
                            )}

                            {/* Expand button — only when selected */}
                            {isSelected && (
                              <button
                                onClick={() => {
                                  if (!isExpanded) {
                                    fetchStudentsForClass(cls);
                                    setExpandedClass(cls.id);
                                  } else {
                                    setExpandedClass(null);
                                  }
                                }}
                                className="text-xs font-semibold px-2 py-1 rounded-lg"
                                style={{ background: isExpanded ? COLORS.accent : "#dbeafe", color: isExpanded ? "#fff" : COLORS.accent }}>
                                {isExpanded ? "▲ Hide" : "▼ Select Students"}
                              </button>
                            )}
                          </div>

                          {/* ── Expanded student list ── */}
                          {isSelected && isExpanded && (
                            <div style={{ borderTop: `1px solid ${COLORS.border}`, background: "#f8fafc" }}>
                              {isLoadingStu ? (
                                <p className="text-xs text-center py-3" style={{ color: COLORS.secondary }}>
                                  Loading students…
                                </p>
                              ) : students.length === 0 ? (
                                <p className="text-xs text-center py-3" style={{ color: COLORS.secondary }}>
                                  No students found in this class
                                </p>
                              ) : (
                                <>
                                  {/* Select all row */}
                                  <div className="flex items-center gap-2 px-4 py-2"
                                    style={{ borderBottom: `1px solid ${COLORS.border}`, background: "#f1f5f9" }}>
                                    <input type="checkbox"
                                      checked={selectedIds.size === students.length}
                                      onChange={(e) => {
                                        const allIds = e.target.checked ? students.map(s => s.id) : [];
                                        setOrderForm((p) => ({
                                          ...p,
                                          classDetails: p.classDetails.map((r) =>
                                            r.className === cls.name
                                              ? { ...r, studentIds: allIds, studentCount: allIds.length }
                                              : r
                                          ),
                                        }));
                                      }}
                                      className="w-4 h-4 accent-blue-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold" style={{ color: COLORS.primary }}>
                                      Select All ({students.length})
                                    </span>
                                  </div>

                                  {/* Individual students */}
                                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                                    {students.map((stu) => {
                                      const checked = selectedIds.has(stu.id);
                                      const name = stu.personalInfo
                                        ? `${stu.personalInfo.firstName} ${stu.personalInfo.lastName}`
                                        : stu.name;
                                      const admNo = stu.enrollments?.[0]?.admissionNumber || "—";
                                      return (
                                        <label key={stu.id}
                                          className="flex items-center gap-3 px-4 py-2 cursor-pointer"
                                          style={{
                                            borderBottom: `1px solid ${COLORS.border}`,
                                            background: checked ? "#eff6ff" : "#fff",
                                          }}>
                                          <input type="checkbox" checked={checked}
                                            onChange={(e) => {
                                              const newIds = e.target.checked
                                                ? [...selectedIds, stu.id]
                                                : [...selectedIds].filter(id => id !== stu.id);
                                              setOrderForm((p) => ({
                                                ...p,
                                                classDetails: p.classDetails.map((r) =>
                                                  r.className === cls.name
                                                    ? { ...r, studentIds: newIds, studentCount: newIds.length }
                                                    : r
                                                ),
                                              }));
                                            }}
                                            className="w-4 h-4 accent-blue-500 cursor-pointer flex-shrink-0"
                                          />
                                          <span className="text-sm flex-1" style={{ color: COLORS.primary }}>{name}</span>
                                          <span className="text-xs" style={{ color: COLORS.secondary }}>#{admNo}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No classes found */}
                {orderForm.schoolId && !loadingClasses && schoolClasses.length === 0 && (
                  <p className="text-xs py-3 text-center rounded-xl"
                    style={{ background: "#fffbeb", color: "#b45309" }}>
                    No classes found for this school. Add classes in Settings first.
                  </p>
                )}

                {/* Total count */}
                {totalCards > 0 && (
                  <div className="mt-3 px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-between"
                    style={{ background: "#f0fdf4", color: "#15803d" }}>
                    <span>{orderForm.classDetails.filter(r => r.studentCount).length} classes selected</span>
                    <span>Total: {totalCards} cards</span>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div>
                <label className="text-xs font-bold mb-2 block" style={{ color: COLORS.primary }}>Contact Person (optional)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="text" placeholder="Name"
                    value={orderForm.contactName}
                    onChange={(e) => setOrderForm((p) => ({ ...p, contactName: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
                  <input type="text" placeholder="Phone"
                    value={orderForm.contactPhone}
                    onChange={(e) => setOrderForm((p) => ({ ...p, contactPhone: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
                  <input type="email" placeholder="Email"
                    value={orderForm.contactEmail}
                    onChange={(e) => setOrderForm((p) => ({ ...p, contactEmail: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: COLORS.primary }}>Notes (optional)</label>
                <textarea placeholder="Any special instructions..."
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                  style={{ border: `1px solid ${COLORS.border}`, outline: "none" }} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setOrderModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.secondary }}>
                Cancel
              </button>
              <button onClick={handlePlaceOrder} disabled={placingOrder}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: placingOrder ? "#6ee7b7" : "#10b981" }}>
                {placingOrder ? "Placing Order…" : `Place Order${totalCards > 0 ? ` (${totalCards} cards)` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setPreviewTemplate(null)}>

          <div
            className="w-full sm:w-auto sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#fff", maxHeight: "92vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}>

            {/* ── Modal header ── */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div className="min-w-0 flex-1 mr-3">
                <p className="font-bold text-sm truncate" style={{ color: COLORS.primary }}>
                  {previewTemplate.title}
                </p>
                <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold mt-0.5"
                  style={{
                    background: previewTemplate.isDefault ? "#eff6ff" : "#f0fdf4",
                    color:      previewTemplate.isDefault ? "#3b82f6" : "#15803d",
                  }}>
                  {previewTemplate.isDefault ? "🌐 Platform Default" : "⭐ Your Design"}
                </span>
              </div>
              {/* ── Close button — always visible ── */}
              <button
                onClick={() => setPreviewTemplate(null)}
                className="flex items-center justify-center rounded-full flex-shrink-0 font-bold text-lg"
                style={{
                  width: 34, height: 34,
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  cursor: "pointer",
                }}>
                ✕
              </button>
            </div>

            {/* ── Image (scrollable) ── */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              <img
                src={previewTemplate.imageUrl}
                alt={previewTemplate.title}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
              {previewTemplate.description && (
                <p className="px-4 py-3 text-sm" style={{ color: COLORS.secondary }}>
                  {previewTemplate.description}
                </p>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="px-4 py-3 flex-shrink-0"
              style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: COLORS.primary }}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}