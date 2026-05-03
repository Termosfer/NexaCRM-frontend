import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Building2, ArrowRight, ShieldCheck, CheckCircle2, ChevronLeft } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { SECTOR_CONFIG, type SectorKey } from '../constants/sectors';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Səhifə vəziyyəti: login və ya register
  const [isLogin, setIsLogin] = useState(false);
  const [sector, setSector] = useState<SectorKey>("DEFAULT");
  
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', companyName: '', businessSector: 'TURIZM' as SectorKey
  });

  // 1. Qeydiyyat funksiyası
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const tId = toast.loading("Hesabınız yaradılır...");
    try {
      await api.post('/auth/register', { ...formData, businessSector: sector });
      toast.success("Hesab yaradıldı!", { id: tId });
      
      // ANİMASİYA: Uğurlu qeydiyyatdan sonra avtomatik Logine keçid
      setTimeout(() => {
        setIsLogin(true);
      }, 500);
    } catch (err) {
      toast.error("Xəta baş verdi.", { id: tId });
    }
  };

  // 2. Giriş funksiyası
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const tId = toast.loading("Giriş edilir...");
    try {
      const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
      login(res.data.token, res.data);
      toast.success("Xoş gəldiniz!", { id: tId });
      navigate('/');
    } catch {
      toast.error("Email və ya şifrə yanlışdır.", { id: tId });
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      
      {/* --- SOL TƏRƏF: DİNAMİK ARXA FON (AnimatePresence ilə) --- */}
      <div className="hidden lg:flex w-1/2 relative">
        <AnimatePresence mode="wait">
          <motion.img
            key={isLogin ? 'login-bg' : sector}
            src={isLogin ? SECTOR_CONFIG["DEFAULT"].image : SECTOR_CONFIG[sector].image}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>

        <div className="relative z-10 p-16 flex flex-col justify-between text-white">
          <motion.div initial={{ y: -20 }} animate={{ y: 0 }}>
             <h2 className="text-2xl font-black italic tracking-tighter text-indigo-400">NexaCRM</h2>
          </motion.div>

          <div>
            <motion.h1 
              key={isLogin ? 't-log' : 't-reg'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-black leading-tight tracking-tighter mb-4"
            >
              {isLogin ? "Yenidən xoş gördük!" : SECTOR_CONFIG[sector].description}
            </motion.h1>
            <p className="text-slate-300 font-medium max-w-sm">
               {isLogin ? "Hesabınıza daxil olaraq idarəetməyə davam edin." : "Biznesinizi rəqəmsallaşdırmaq üçün ilk addımı atın."}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-black opacity-40 uppercase tracking-[0.3em]">
            <span>Secure Cloud Infrastructure v2.0</span>
          </div>
        </div>
      </div>

      {/* --- SAĞ TƏRƏF: FORM HİSSƏSİ --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <AnimatePresence mode="wait">
          {!isLogin ? (
            /* REGISTER FORM */
            <motion.div 
              key="register"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-md space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Yeni Hesab</h3>
                <p className="text-slate-400 text-sm font-bold">Məlumatları daxil edin</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <AuthInput label="Ad Soyad" icon={<User size={16}/>} value={formData.fullName} onChange={v => setFormData({...formData, fullName: v})} />
                   <AuthInput label="Şirkət" icon={<Building2 size={16}/>} value={formData.companyName} onChange={v => setFormData({...formData, companyName: v})} />
                </div>
                <AuthInput label="E-poçt" icon={<Mail size={16}/>} type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
                <AuthInput label="Şifrə" icon={<Lock size={16}/>} type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} />

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sektor Seçin</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(SECTOR_CONFIG) as SectorKey[]).filter(k => k !== 'DEFAULT').map(k => (
                      <button 
                        key={k} type="button" onClick={() => setSector(k)}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${sector === k ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50'}`}
                      >
                        {React.createElement(SECTOR_CONFIG[k].icon, { size: 16, className: sector === k ? 'text-indigo-600' : 'text-slate-400' })}
                        <span className={`text-[8px] font-black uppercase ${sector === k ? 'text-indigo-600' : 'text-slate-400'}`}>{k}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                  Qeydiyyatı Tamamla
                </button>
              </form>
              <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                Artıq hesabın var? <button onClick={() => setIsLogin(true)} className="text-indigo-600 font-black">Daxil ol</button>
              </p>
            </motion.div>
          ) : (
            /* LOGIN FORM */
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-md space-y-8"
            >
              <div className="space-y-1">
                <button onClick={() => setIsLogin(false)} className="flex items-center text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:gap-2 transition-all">
                  <ChevronLeft size={14}/> Geri Qayıt
                </button>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter pt-2">Xoş Gördük</h3>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Giriş üçün məlumatları daxil edin</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <AuthInput label="E-POÇT" icon={<Mail size={16}/>} type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
                <AuthInput label="ŞİFRƏ" icon={<Lock size={16}/>} type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} />
                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">
                  Sistemə Giriş
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- SELİQƏLİ İNPUT KOMPONENTİ ---
const AuthInput = ({ label, icon, value, onChange, type = "text" }: any) => (
  <div className="space-y-1.5">
    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">{icon}</div>
      <input 
        required type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 transition-all text-sm"
      />
    </div>
  </div>
);

export default AuthPage;