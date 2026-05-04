import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  X,
  Building2,
  Mail,
  Lock,
  DollarSign,
  Loader2,
  UserCircle,
  Edit2,
  Trash2,
  AlertCircle,
  Award,
  CheckCircle2,
  Archive,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";
import type { User, Department } from "../types";
import { useAuth } from "../context/AuthContext";

// DTO Payload (Back-endə gedən məlumat)
interface UserPayload {
  name: string;
  email: string;
  password?: string;
  role: string;
  jobTitle: string;
  salary: number;
  bonusAmount: number;
  departmentId: string;
  organizationId: string;
}

// React daxilində Form State tipi
interface UserFormState {
  name: string;
  email: string;
  password: string;
  role: string;
  jobTitle: string;
  salary: string; // Inputda rahat yazmaq üçün string saxlayırıq
  bonusAmount: string; // Inputda rahat yazmaq üçün string saxlayırıq
  departmentId: string;
}

const JOB_TITLES: Record<string, { MANAGER: string[]; USER: string[] }> = {
  TURIZM: {
    MANAGER: ["Turizm Meneceri", "Filial Rəhbəri"],
    USER: ["Tur Agenti", "Viza Mütəxəssisi"],
  },
  KURS: {
    MANAGER: ["Tədris Müdiri", "Şöbə Rəhbəri"],
    USER: ["Müəllim", "Mentor"],
  },
  EMLAK: {
    MANAGER: ["Satış Müdiri", "Bölgə Meneceri"],
    USER: ["Makler", "Satış Təmsilçisi"],
  },
  AVTO: {
    MANAGER: ["Avtosalon Müdiri", "Servis Meneceri"],
    USER: ["Satış Təmsilçisi", "Mexanik"],
  },
  DEFAULT: {
    MANAGER: ["Şöbə Müdiri", "Layihə Rəhbəri"],
    USER: ["Mütəxəssis", "Assistent"],
  },
};

const Team: React.FC = () => {
  const { user } = useAuth();
  const ORG_ID = user?.organizationId || "";
  const userSector = (user?.businessSector || "DEFAULT") as string;
  const currentTitles = JOB_TITLES[userSector] || JOB_TITLES.DEFAULT;
  const queryClient = useQueryClient();

  // --- STATE ---
  const [showActive, setShowActive] = useState<boolean>(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [userForm, setUserForm] = useState<UserFormState>({
    name: "",
    email: "",
    password: "",
    role: "USER",
    jobTitle: currentTitles.USER[0],
    salary: "",
    bonusAmount: "0",
    departmentId: "",
  });

  // --- DATA FETCHING ---
  const { data: rawDepartments } = useQuery<Department[]>({
    queryKey: ["departments", ORG_ID],
    queryFn: () =>
      api.get(`/team/departments/${ORG_ID}`).then((res) => res.data),
    enabled: !!ORG_ID,
  });

  const { data: rawTeamMembers, isLoading: teamLoading } = useQuery<User[]>({
    queryKey: ["teamMembers", ORG_ID],
    queryFn: () => api.get(`/team/users/${ORG_ID}`).then((res) => res.data),
    enabled: !!ORG_ID,
  });

  const departments = Array.isArray(rawDepartments) ? rawDepartments : [];
  const teamMembers = Array.isArray(rawTeamMembers) ? rawTeamMembers : [];

  // 🛡️ AKTİV VƏ QOVULAN İŞÇİLƏRİ AYIRIRIQ
  const displayedMembers = teamMembers.filter((m) => {
    const currentStatus = m.status || "ACTIVE";
    return showActive ? currentStatus === "ACTIVE" : currentStatus !== "ACTIVE";
  });

  // --- MUTATIONS ---
  const saveUserMutation = useMutation({
    mutationFn: (payload: UserPayload) => {
      if (editingUser) return api.put(`/team/users/${editingUser.id}`, payload);
      return api.post("/team/users", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      closeModal();
      toast.success(
        editingUser ? "Məlumatlar yeniləndi!" : "İşçi əlavə edildi!",
      );
    },
    onError: () => toast.error("Xəta baş verdi. Məlumatları yoxlayın."),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/team/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsDeleteModalOpen(false);
      setUserIdToDelete(null);
      toast.success("İşçi arxivləşdirildi!");
    },
  });

  const restoreUserMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/team/users/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("İşçi yenidən aktiv edildi!");
    },
  });

  // --- HANDLERS ---
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.departmentId) return toast.error("Şöbə seçilməlidir");

    // String gələn rəqəmləri Təhlükəsiz Number-ə çeviririk
    const payload: UserPayload = {
      ...userForm,
      salary: Number(userForm.salary) || 0,
      bonusAmount: Number(userForm.bonusAmount) || 0,
      organizationId: ORG_ID,
    };

    saveUserMutation.mutate(payload);
  };

  const handleRoleChange = (newRole: "MANAGER" | "USER") => {
    setUserForm({
      ...userForm,
      role: newRole,
      jobTitle: currentTitles[newRole][0],
    });
  };

  const openEditModal = (member: User) => {
    setEditingUser(member);
    setUserForm({
      name: member.name || "",
      email: member.email || "",
      password: "", // Edit zamanı şifrə gizli qalır
      role: member.role || "USER",
      jobTitle: member.jobTitle || currentTitles.USER[0],

      // String() vasitəsilə mütləq şəkildə mətnə çeviririk ki, xəta verməsin
      salary:
        member.salary !== undefined && member.salary !== null
          ? String(member.salary)
          : "0",
      bonusAmount:
        member.bonusAmount !== undefined && member.bonusAmount !== null
          ? String(member.bonusAmount)
          : "0",
      departmentId: member.department?.id ? String(member.department.id) : "",
    });
    setIsUserModalOpen(true);
  };

  const closeModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
    setUserForm({
      name: "",
      email: "",
      password: "",
      role: "USER",
      jobTitle: currentTitles.USER[0],
      salary: "",
      bonusAmount: "0",
      departmentId: "",
    });
  };

  if (teamLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600 size-12" />
      </div>
    );

  return (
    <div className="p-8 space-y-8 bg-[#fbfcfd] min-h-screen font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic">
            Komanda Siyahısı
          </h1>

          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-fit mt-6">
            <button
              onClick={() => setShowActive(true)}
              className={`flex items-center px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${showActive ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <CheckCircle2 size={14} className="mr-2" /> Aktiv İşçilər
            </button>
            <button
              onClick={() => setShowActive(false)}
              className={`flex items-center px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!showActive ? "bg-white text-rose-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <Archive size={14} className="mr-2" /> Keçmiş İşçilər
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsUserModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center"
        >
          <Plus size={18} className="mr-2" /> İşçi Əlavə Et
        </button>
      </div>

      <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/20 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
              <tr>
                <th className="px-10 py-7">İşçi Profili</th>
                <th className="px-10 py-7">Vəzifə / Şöbə</th>
                <th className="px-10 py-7">Rol / Status</th>
                <th className="px-10 py-7 text-right">Maaş & Bonus</th>
                <th className="px-10 py-7 text-right">İdarəetmə</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayedMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-32 text-center text-slate-400 italic font-bold tracking-widest uppercase text-xs"
                  >
                    Bu siyahıda işçi yoxdur
                  </td>
                </tr>
              ) : (
                displayedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`size-12 rounded-[18px] flex items-center justify-center font-black text-white shadow-md ${!showActive ? "bg-slate-300" : member.role === "ADMIN" ? "bg-slate-800" : member.role === "MANAGER" ? "bg-linear-to-br from-indigo-500 to-violet-600" : "bg-emerald-500"}`}
                        >
                          {member.name[0]}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-base flex items-center">
                            {member.name}
                            {member.role === "ADMIN" && (
                              <ShieldCheck
                                size={14}
                                className="ml-2 text-indigo-500"
                              />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="text-sm font-black text-slate-700">
                        {member.jobTitle || "Təyin edilməyib"}
                      </div>
                      <div className="flex items-center mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Building2 size={12} className="mr-1 text-indigo-400" />{" "}
                        {member.department?.name || "Baş İdarə"}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col items-start space-y-2">
                        <span
                          className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest
                          ${
                            member.role === "ADMIN"
                              ? "bg-rose-50 text-rose-600"
                              : member.role === "MANAGER"
                                ? "bg-indigo-50 text-indigo-600"
                                : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {member.role}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center
                          ${(member.status || "ACTIVE") === "ACTIVE" ? "bg-emerald-100/50 text-emerald-600" : "bg-rose-100/50 text-rose-600"}`}
                        >
                          <span
                            className={`size-1.5 rounded-full mr-1.5 ${(member.status || "ACTIVE") === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"}`}
                          ></span>
                          {(member.status || "ACTIVE") === "ACTIVE"
                            ? "İşləyir"
                            : "Qovulub"}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div
                        className={`font-black text-base ${!showActive ? "text-slate-300" : "text-slate-800"}`}
                      >
                        ${member.salary?.toLocaleString() || "0"}
                      </div>
                      {(member.bonusAmount ?? 0) > 0 && showActive && (
                        <div className="text-[10px] font-black text-emerald-500 flex items-center justify-end mt-1">
                          <Award size={12} className="mr-1" /> +$
                          {member.bonusAmount?.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-6 text-right">
                      {member.role === "ADMIN" ? (
                        <div className="flex justify-end pr-4">
                          <div
                            className="p-3 bg-slate-50 text-slate-300 rounded-xl cursor-not-allowed"
                            title="Təsisçini idarə etmək olmaz"
                          >
                            <Lock size={16} />
                          </div>
                        </div>
                      ) : !showActive ? (
                        <div className="flex justify-end pr-4">
                          {user?.role === "ADMIN" ? (
                            <button
                              onClick={() =>
                                restoreUserMutation.mutate(member.id)
                              }
                              disabled={restoreUserMutation.isPending}
                              className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                            >
                              <RotateCcw size={14} className="mr-2" />{" "}
                              {restoreUserMutation.isPending
                                ? "BƏRPA..."
                                : "İŞƏ QAYTAR"}
                            </button>
                          ) : (
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                              SƏLAHİYYƏT YOXDUR
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm active:scale-90"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setUserIdToDelete(member.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm active:scale-90"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* İŞÇİ YARATMA/REDAKTƏ MODALI */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl border border-indigo-50"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic">
                  {editingUser ? "İşçini Yenilə" : "Yeni İşçi"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveUser} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Ad Soyad"
                    icon={<UserCircle size={16} />}
                    value={userForm.name}
                    onChange={(v: string) =>
                      setUserForm({ ...userForm, name: v })
                    }
                  />
                  <FormInput
                    label="E-poçt"
                    type="email"
                    icon={<Mail size={16} />}
                    value={userForm.email}
                    onChange={(v: string) =>
                      setUserForm({ ...userForm, email: v })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
                      {editingUser ? "Şifrə (Opsional)" : "Şifrə *"}
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                        size={16}
                      />
                      <input
                        type="text"
                        value={userForm.password}
                        onChange={(e) =>
                          setUserForm({ ...userForm, password: e.target.value })
                        }
                        placeholder={
                          editingUser
                            ? "Boş qoysanız dəyişməz"
                            : "Şifrə daxil edin"
                        }
                        required={!editingUser}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
                      Şöbə
                    </label>
                    <select
                      required
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-xs cursor-pointer"
                      value={userForm.departmentId}
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          departmentId: e.target.value,
                        })
                      }
                    >
                      <option value="">Seçin...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
                      Sistem Rolu
                    </label>
                    <select
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-xs cursor-pointer"
                      value={userForm.role}
                      onChange={(e) =>
                        handleRoleChange(e.target.value as "MANAGER" | "USER")
                      }
                    >
                      <option value="USER">Adi İşçi</option>
                      <option value="MANAGER">Şöbə Müdiri</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
                      Vəzifə Təyinatı
                    </label>
                    <select
                      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-xs cursor-pointer"
                      value={userForm.jobTitle}
                      onChange={(e) =>
                        setUserForm({ ...userForm, jobTitle: e.target.value })
                      }
                    >
                      {currentTitles[userForm.role as "MANAGER" | "USER"].map(
                        (t: string) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100/50">
                  <FormInput
                    label="Maaş ($)"
                    type="number"
                    icon={<DollarSign size={16} className="text-indigo-400" />}
                    value={userForm.salary}
                    onChange={(v: string) =>
                      setUserForm({ ...userForm, salary: v })
                    }
                  />
                  <FormInput
                    label="Aylıq Bonus ($)"
                    type="number"
                    icon={<Award size={16} className="text-emerald-500" />}
                    value={userForm.bonusAmount}
                    onChange={(v: string) =>
                      setUserForm({ ...userForm, bonusAmount: v })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={saveUserMutation.isPending}
                  className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95 mt-4 disabled:opacity-50"
                >
                  {saveUserMutation.isPending
                    ? "YÜKLƏNİR..."
                    : editingUser
                      ? "MƏLUMATLARI YENİLƏ"
                      : "SİSTEMƏ ƏLAVƏ ET"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-110 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10 text-center border border-rose-50"
            >
              <div className="size-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">
                İşçini Arxivləmək?
              </h3>
              <p className="text-slate-500 font-bold text-sm mb-8">
                Bu işçi sistemdən uzaqlaşdırılacaq. Onun bütün keçmiş satışları
                qorunub saxlanacaq.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase text-[10px] tracking-widest"
                >
                  Ləğv et
                </button>
                <button
                  onClick={() => deleteUserMutation.mutate(userIdToDelete!)}
                  disabled={deleteUserMutation.isPending}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  {deleteUserMutation.isPending
                    ? "ARXİVLƏNİR..."
                    : "Bəli, Arxivlə"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Alt komponent: Tiplər tam təyin olunub (Heç bir "any" yoxdur)
interface FormInputProps {
  label: string;
  icon: React.ReactNode;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  icon,
  value,
  onChange,
  type = "text",
}) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors">
        {icon}
      </div>
      <input
        required={type !== "password"}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none font-bold text-slate-700 transition-all text-xs"
      />
    </div>
  </div>
);

export default Team;
