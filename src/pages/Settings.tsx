import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AxiosResponse, AxiosError } from 'axios';
import { 
  User as UserIcon, Lock, Building2, Save, ShieldCheck, Mail, AlertCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import type { ApiError, ProfileUpdatePayload, PasswordChangePayload, User } from '../types';
import { useAuth } from '../context/AuthContext';

const Settings: React.FC = () => {
  const { user, login, token } = useAuth();

  // 1. HOOK-LAR HƏMİŞƏ ƏN ÜSTDƏ OLMALIDIR (Şərtsiz işləməlidir)
  const [profileForm, setProfileForm] = useState<ProfileUpdatePayload>({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // --- MUTATIONS ---
  const updateProfileMutation = useMutation<AxiosResponse<User>, AxiosError<ApiError>, ProfileUpdatePayload>({
    // user?.id yazaraq sığortalayırıq ki, əgər user yoxdursa null xətası verməsin
    mutationFn: (data) => api.put(`/users/${user?.id}/profile`, data),
    onSuccess: (res) => {
      if (token && user) {
        // ...user (köhnə məlumatlar) və üstünə gələn yeni name, email yazılır
        login(token, { ...user, name: res.data.name, email: res.data.email });
      }
      toast.success("Profil uğurla yeniləndi!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Profil yenilənmədi. Məlumatları yoxlayın.");
    }
  });

  const changePasswordMutation = useMutation<AxiosResponse<string>, AxiosError<ApiError>, PasswordChangePayload>({
    mutationFn: (data) => api.put(`/users/${user?.id}/password`, data),
    onSuccess: () => {
      toast.success("Şifrə uğurla dəyişdirildi!");
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Köhnə şifrə yanlışdır!");
    }
  });

  // 2. ERKEN ÇIXIŞ (Early Return) BÜTÜN HOOK-LARDAN SONRA YAZILMALIDIR!
  if (!user) return null;

  // --- HANDLERS ---
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      return toast.error("Ad və Email boş ola bilməz!");
    }
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      return toast.error("Yeni şifrə ən azı 8 simvol olmalıdır!");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Yeni şifrələr üst-üstə düşmür!");
    }
    
    changePasswordMutation.mutate({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });
  };

  // ... (Geri qalan RETURN / JSX Hissəsi bayaqkı kimi olduğu kimi qalır)
  return (
    <div className="p-8 space-y-8 bg-[#fbfcfd] min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic">Ayarlar</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Şəxsi profil və təhlükəsizlik parametrləri</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* SOL TƏRƏF (Profil və Şirkət xülasəsi) */}
        <div className="xl:col-span-1 space-y-8">
          
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="size-24 bg-linear-to-br from-indigo-500 to-violet-600 text-white rounded-4xl flex items-center justify-center font-black text-4xl shadow-xl shadow-indigo-200 mb-6 transform -rotate-3">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{user.name}</h3>
            <p className="text-sm font-bold text-slate-400 mt-1">{user.email}</p>
            
            <div className="mt-6 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center">
              <ShieldCheck size={14} className="mr-2" /> {user.role} STATUSU
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
              <Building2 size={16} className="mr-2" /> İş Yeri Məlumatları
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Şirkət Adı</p>
                <p className="text-sm font-black text-slate-800">{user.companyName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Biznes Sektoru</p>
                <p className="text-sm font-black text-indigo-600">{user.businessSector}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start space-x-3 mt-4">
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                  Şirkət məlumatlarını yalnız sistem admini dəyişdirə bilər. Dəstək üçün əlaqə saxlayın.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* SAĞ TƏRƏF (Formlar) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* PROFIL YENİLƏMƏ */}
          <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-8 flex items-center">
              <UserIcon className="mr-3 text-indigo-500" /> Şəxsi Məlumatlar
            </h3>
            
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Ad Soyad</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={18} />
                    <input 
                      required type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 outline-none font-bold text-slate-700 transition-all text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">E-Poçt Ünvanı</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={18} />
                    <input 
                      required type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 outline-none font-bold text-slate-700 transition-all text-sm" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" disabled={updateProfileMutation.isPending} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center">
                  {updateProfileMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16}/>}
                  Məlumatları Yadda Saxla
                </button>
              </div>
            </form>
          </div>

          {/* ŞİFRƏ DƏYİŞDİRMƏ */}
          <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-8 flex items-center">
              <Lock className="mr-3 text-rose-500" /> Təhlükəsizlik
            </h3>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2 max-w-md">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Hazırkı Şifrə</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500" size={18} />
                  <input 
                    required type="password" placeholder="••••••••" value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:bg-white focus:border-rose-100 outline-none font-bold text-slate-700 transition-all text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Yeni Şifrə</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500" size={18} />
                    <input 
                      required type="password" placeholder="••••••••" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:bg-white focus:border-rose-100 outline-none font-bold text-slate-700 transition-all text-sm" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Yeni Şifrə (Təkrar)</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500" size={18} />
                    <input 
                      required type="password" placeholder="••••••••" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:bg-white focus:border-rose-100 outline-none font-bold text-slate-700 transition-all text-sm" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" disabled={changePasswordMutation.isPending} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center">
                  {changePasswordMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16}/> : <ShieldCheck className="mr-2" size={16}/>}
                  Şifrəni Yenilə
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;