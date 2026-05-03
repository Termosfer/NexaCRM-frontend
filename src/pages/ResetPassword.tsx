import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success("Şifrəniz yeniləndi! İndi daxil ola bilərsiniz.");
      navigate('/login');
    } catch {
      toast.error("Link keçərsizdir və ya vaxtı bitib.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white w-full max-w-md p-10 rounded-[40px] shadow-2xl space-y-8 animate-in zoom-in duration-300">
        <h3 className="text-3xl font-black text-slate-800 text-center tracking-tighter">Yeni Şifrə Təyin Et</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={20}/>
            <input 
              required type="password" 
              className="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold" 
              placeholder="Yeni şifrəniz"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <button className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl flex items-center justify-center">
            ŞİFRƏNİ YENİLƏ <CheckCircle size={16} className="ml-2"/>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;