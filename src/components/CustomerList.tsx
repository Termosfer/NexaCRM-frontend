import React, { useState, useEffect } from "react";
import {
  Mail, Phone, Building2, Search, Edit2, Trash2,
  ChevronLeft, ChevronRight, UserPlus, X, Loader2,
  RotateCcw, Archive, CheckCircle2, Filter, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import type { Customer, PageResponse } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const CustomerList: React.FC = () => {
  const { user } = useAuth();
  const ORG_ID = user?.organizationId;
  const queryClient = useQueryClient();

  const[search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showActive, setShowActive] = useState(true);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const[sortDir, setSortDir] = useState("desc");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerIdToDelete, setCustomerIdToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", companyName: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: pageData, isLoading } = useQuery<PageResponse<Customer>>({
    queryKey:["customers", ORG_ID, debouncedSearch, page, showActive, sortBy, sortDir],
    queryFn: () =>
      api.get(`/customers/org/${ORG_ID}`, {
        params: { query: debouncedSearch, page, size: 7, active: showActive, sortBy, direction: sortDir },
      }).then((res) => res.data),
    enabled: !!ORG_ID,
  });

  const customers = pageData?.content ||[];
  const totalPages = pageData?.totalPages || 0;

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (editingCustomer) return api.put(`/customers/${editingCustomer.id}`, data);
      return api.post("/customers", { ...data, organizationId: ORG_ID });
    },
    onSuccess: () => {
      toast.success(editingCustomer ? "Yeniləndi!" : "Yeni müştəri əlavə edildi!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      closeFormModal();
      if (!editingCustomer) {
        setSortBy("createdAt");
        setSortDir("desc");
        setPage(0);
      }
    },
    onError: () => toast.error("Xəta baş verdi!"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      toast.success("Müştəri arxivləşdirildi!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsDeleteModalOpen(false);
      setCustomerIdToDelete(null);
    },
    onError: () => toast.error("Silmək mümkün olmadı"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/customers/${id}/restore`),
    onSuccess: () => {
      toast.success("Müştəri yenidən aktiv edildi!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, companyName: c.companyName });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingCustomer(null);
    setFormData({ firstName: "", lastName: "", email: "", phone: "", companyName: "" });
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  
  const renderPaginationButtons = () => {
    if (totalPages === 0) return null;

    let startPage = Math.max(0, page - 2);
    let endPage = Math.min(totalPages - 1, page + 2);

    
    if (endPage - startPage < 4) {
      if (startPage === 0) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (endPage === totalPages - 1) {
        startPage = Math.max(0, totalPages - 5);
      }
    }

    const pages =[];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages.map((i) => (
      <button 
        key={i} 
        onClick={() => setPage(i)} 
        className={`size-12 rounded-2xl font-black text-xs transition-all ${page === i ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105" : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100"}`}
      >
        {i + 1}
      </button>
    ));
  };

  return (
    <div className="p-8 space-y-6 bg-[#fbfcfd] min-h-screen font-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic">Nexa Clients</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Müştəri İdarəetmə Paneli</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ firstName: "", lastName: "", email: "", phone: "", companyName: "" });
            setIsFormModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[22px] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center"
        >
          <UserPlus className="mr-2" size={18} /> Yeni Müştəri
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={22} />
          <input
            type="text"
            placeholder="Ada, şirkətə və ya e-poçta görə axtar..."
            className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-50 rounded-[28px] shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all font-bold text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative w-full md:w-auto">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`w-full md:w-auto flex items-center justify-center px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all border ${isFilterOpen ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100" : "bg-white text-slate-600 border-slate-50 hover:bg-slate-50"}`}
          >
            <Filter size={18} className="mr-3" />
            Filtrləmə
            <ChevronDown size={16} className={`ml-3 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-3 w-72 bg-white border border-slate-100 rounded-4xl shadow-2xl z-20 p-6"
              >
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sıralama</p>
                    <div className="grid grid-cols-1 gap-2">
                      <SortOption active={sortBy === "createdAt"} label="İlkin (Ən Yeni)" onClick={() => { setSortBy("createdAt"); setSortDir("desc"); setIsFilterOpen(false); }} />
                      <SortOption active={sortBy === "firstName"} label="Ada görə" onClick={() => { setSortBy("firstName"); setSortDir("asc"); setIsFilterOpen(false); }} />
                      <SortOption active={sortBy === "companyName"} label="Şirkətə görə" onClick={() => { setSortBy("companyName"); setSortDir("asc"); setIsFilterOpen(false); }} />
                    </div>
                  </div>
                  <div className="h-px bg-slate-50"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Status</p>
                    <div className="space-y-2">
                      <button onClick={() => { setShowActive(true); setIsFilterOpen(false); setPage(0); }} className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${showActive ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-500 hover:bg-slate-50"}`}>
                        <span className="text-xs">Aktivlər</span>
                        {showActive && <CheckCircle2 size={16} />}
                      </button>
                      <button onClick={() => { setShowActive(false); setIsFilterOpen(false); setPage(0); }} className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${!showActive ? "bg-rose-50 text-rose-600 font-bold" : "text-slate-500 hover:bg-slate-50"}`}>
                        <span className="text-xs">Arxiv / Passiv</span>
                        {!showActive && <Archive size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[40px] shadow-xl shadow-slate-200/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                <th className="px-10 py-7 cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => toggleSort("firstName")}>
                  Müştəri Profili {sortBy === "firstName" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-10 py-7 cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => toggleSort("companyName")}>
                  Təşkilat {sortBy === "companyName" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-10 py-7">Əlaqə Kanalları</th>
                <th className="px-10 py-7 text-right">İdarəetmə</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="animate-spin size-10 text-indigo-500 mx-auto" /></td></tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-5">
                        <div className={`size-14 rounded-[22px] flex items-center justify-center font-black text-xl shadow-lg ${showActive ? "bg-linear-to-tr from-indigo-500 to-violet-600 text-white shadow-indigo-100" : "bg-slate-200 text-slate-500"}`}>
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-lg tracking-tight mb-1">{c.firstName} {c.lastName}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {c.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center text-slate-600 font-bold text-sm">
                        <Building2 size={16} className="mr-3 text-indigo-400" /> {c.companyName || "N/A"}
                      </div>
                    </td>
                    <td className="px-10 py-6 space-y-2 text-xs text-slate-500 font-bold">
                      <div className="flex items-center"><Mail size={14} className="mr-3 text-indigo-300" /> {c.email}</div>
                      <div className="flex items-center"><Phone size={14} className="mr-3 text-indigo-300" /> {c.phone}</div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end space-x-2">
                        {showActive ? (
                          <>
                            <button onClick={() => openEditModal(c)} className="p-3.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-[18px] transition-all shadow-sm active:scale-90"><Edit2 size={18} /></button>
                            <button onClick={() => { setCustomerIdToDelete(c.id); setIsDeleteModalOpen(true); }} className="p-3.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white rounded-[18px] transition-all shadow-sm active:scale-90"><Trash2 size={18} /></button>
                          </>
                        ) : (
                          <button onClick={() => restoreMutation.mutate(c.id)} className="flex items-center px-6 py-3 bg-emerald-50 text-emerald-600 rounded-[18px] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-sm active:scale-95">
                            <RotateCcw size={16} className="mr-2" /> Geri Qaytar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="py-32 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic">Məlumat Tapılmadı</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50/50 px-10 py-6 flex justify-between items-center border-t border-slate-50">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Səhifə {page + 1} / {totalPages || 1}</span>
           <div className="flex items-center space-x-3">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-3 bg-white rounded-2xl border border-slate-100 disabled:opacity-30 hover:shadow-md transition-all"><ChevronLeft size={20} /></button>
              
              <div className="flex space-x-2">
                 {renderPaginationButtons()}
              </div>

              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-3 bg-white rounded-2xl border border-slate-100 disabled:opacity-30 hover:shadow-md transition-all"><ChevronRight size={20} /></button>
           </div>
        </div>
      </div>

      {/* --- FORM MODAL --- */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[48px] w-full max-w-xl shadow-2xl overflow-hidden border border-indigo-50">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic">{editingCustomer ? "Redaktə Et" : "Yeni Müştəri"}</h3>
                <button onClick={closeFormModal} className="p-3 hover:bg-white rounded-full shadow-sm transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <FormInput label="Ad" value={formData.firstName} onChange={(v) => setFormData({ ...formData, firstName: v })} />
                  <FormInput label="Soyad" value={formData.lastName} onChange={(v) => setFormData({ ...formData, lastName: v })} />
                </div>
                <FormInput label="E-Poçt" type="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
                <FormInput label="Telefon" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
                <FormInput label="Şirkət" value={formData.companyName} onChange={(v) => setFormData({ ...formData, companyName: v })} />
                
                <button type="submit" disabled={saveMutation.isPending} className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 mt-6 disabled:opacity-50">
                  {saveMutation.isPending ? "Yüklənir..." : editingCustomer ? "Yadda Saxla" : "Müştərini Yarat"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DELETE MODAL --- */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-110 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[48px] w-full max-w-md shadow-2xl overflow-hidden border border-rose-50">
              <div className="p-12 text-center">
                <div className="size-24 bg-rose-50 text-rose-500 rounded-4xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Archive size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">Arxivlənsin?</h3>
                <p className="text-slate-500 font-bold leading-relaxed text-sm">Müştəri <span className="text-rose-500 font-black uppercase">Arxiv</span> siyahısına göndəriləcək. İstədiyiniz vaxt geri qaytara bilərsiniz.</p>
              </div>
              <div className="p-8 bg-slate-50 flex gap-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Ləğv et</button>
                <button onClick={() => deleteMutation.mutate(customerIdToDelete!)} disabled={deleteMutation.isPending} className="flex-1 py-5 bg-rose-500 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50">
                  {deleteMutation.isPending ? "Silinir..." : "Bəli, Arxivlə"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};


const SortOption = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`w-full text-left px-5 py-3 rounded-2xl text-[11px] uppercase tracking-widest font-black transition-all ${active ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-50"}`}>
    {label}
  </button>
);

const FormInput = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div className="space-y-2">
    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{label}</label>
    <input
      required type={type} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none font-bold text-slate-700 transition-all"
    />
  </div>
);

export default CustomerList;