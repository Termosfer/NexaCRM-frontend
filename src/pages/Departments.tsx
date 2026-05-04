import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  X,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";
import type { Department, User } from "../types";
import { useAuth } from "../context/AuthContext";

const Departments: React.FC = () => {
  const { user } = useAuth();
  const ORG_ID = user?.organizationId || "";
  const queryClient = useQueryClient();

  // --- STATE-LƏR ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptIdToDelete, setDeptIdToDelete] = useState<string | null>(null);
  const [deptName, setDeptName] = useState<string>("");

  // --- DATA FETCHING ---
  const { data: rawDepartments, isLoading: deptsLoading } = useQuery<
    Department[]
  >({
    queryKey: ["departments", ORG_ID],
    queryFn: () =>
      api.get(`/team/departments/${ORG_ID}`).then((res) => res.data),
    enabled: !!ORG_ID,
  });

  // İşçi sayını hesablamaq üçün bütün işçiləri də çəkirik
  const { data: rawTeamMembers, isLoading: teamLoading } = useQuery<User[]>({
    queryKey: ["teamMembers", ORG_ID],
    queryFn: () => api.get(`/team/users/${ORG_ID}`).then((res) => res.data),
    enabled: !!ORG_ID,
  });

  // Sığortalı datalar
  const departments = Array.isArray(rawDepartments) ? rawDepartments : [];
  const teamMembers = Array.isArray(rawTeamMembers) ? rawTeamMembers : [];
  console.log(departments, "ads");
  // --- MUTATIONS ---
  const saveMutation = useMutation({
    mutationFn: (name: string) => {
      if (editingDept) {
        return api.put(`/team/departments/${editingDept.id}?name=${name}`);
      }
      return api.post(`/team/departments?name=${name}&orgId=${ORG_ID}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsModalOpen(false);
      setDeptName("");
      setEditingDept(null);
      toast.success(editingDept ? "Şöbə yeniləndi!" : "Yeni şöbə yaradıldı!");
    },
    onError: () => toast.error("Xəta baş verdi."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/team/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsDeleteModalOpen(false);
      setDeptIdToDelete(null);
      toast.success("Şöbə silindi!");
    },
    onError: () =>
      toast.error(
        "Şöbəni silmək mümkün olmadı. Əvvəlcə daxilindəki işçiləri silin və ya başqa şöbəyə köçürün.",
      ),
  });

  // --- HANDLERS ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return toast.error("Şöbə adını yazın");
    saveMutation.mutate(deptName);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
    setDeptName("");
  };

  if (deptsLoading || teamLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 size-12" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-[#fbfcfd] min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic">
            Şöbələr
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
            Şirkətinizin strukturunu idarə edin
          </p>
        </div>
        <button
          onClick={() => {
            closeFormModal();
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center"
        >
          <Plus size={18} className="mr-2" /> Yeni Şöbə
        </button>
      </div>

      {/* CƏDVƏL (TABLE) */}
      <div className="bg-white border border-slate-100 rounded-[40px] shadow-2xl shadow-slate-200/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
              <tr>
                <th className="px-10 py-7">Şöbə Adı</th>
                <th className="px-10 py-7 text-center">İşçi Sayı</th>
                <th className="px-10 py-7">Yaranma Tarixi</th>
                <th className="px-10 py-7 text-right">İdarəetmə</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {departments.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-24 text-center text-slate-400 italic font-bold"
                  >
                    Hələ heç bir şöbə yaradılmayıb
                  </td>
                </tr>
              ) : (
                departments.map((dept) => {
                  const empCount = teamMembers.filter(
                    (m) => m.department?.id === dept.id,
                  ).length;

                  // TARİX FORMATLAMASI (Gözəl görünüş üçün)
                  const formattedDate = dept?.createdAt
                    ? new Date(dept.createdAt).toLocaleDateString("az-AZ", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "Tarix yoxdur";

                  return (
                    <tr
                      key={dept.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="size-12 bg-indigo-50 text-indigo-600 rounded-[18px] flex items-center justify-center font-black shadow-sm">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <div className="font-black text-slate-800 text-base">
                              {dept.name}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              ID: {String(dept.id).slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-10 py-6 text-center">
                        <span className="inline-flex items-center px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl font-black text-[11px]">
                          <Users size={14} className="mr-2" /> {empCount}
                        </span>
                      </td>

                      <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {/* DİNAMİK TARİX BURADA GÖRÜNƏCƏK */}
                        {formattedDate}
                      </td>

                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(dept)}
                            className="p-3.5 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:shadow-md rounded-2xl transition-all active:scale-90"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            // BURADAKİ String() xətanı (number assign error) sığortalayır
                            onClick={() => {
                              setDeptIdToDelete(String(dept.id));
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-3.5 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:shadow-md rounded-2xl transition-all active:scale-90"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-sm p-10 shadow-2xl border border-indigo-50"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic">
                  {editingDept ? "Şöbəni Yenilə" : "Yeni Şöbə"}
                </h3>
                <button
                  onClick={closeFormModal}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    ŞÖBƏNİN ADI
                  </label>
                  <input
                    required
                    className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 transition-all text-sm"
                    placeholder="Məs: Satış Departamenti"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 mt-4"
                >
                  {saveMutation.isPending
                    ? "YÜKLƏNİR..."
                    : editingDept
                      ? "YADDA SAXLA"
                      : "ŞÖBƏ YARAT"}
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
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10 text-center border border-rose-50"
            >
              <div className="size-24 bg-rose-50 text-rose-500 rounded-4xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">
                Şöbə Silinsin?
              </h3>
              <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8">
                Bu şöbə sistemdən silinəcək. Əgər daxilində işçilər varsa,
                silinmə uğursuz ola bilər.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-5 font-black text-slate-400 hover:text-slate-600 uppercase text-[10px] tracking-widest transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deptIdToDelete!)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-5 bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "SİLİNİR..." : "Bəli, Sil"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Departments;
