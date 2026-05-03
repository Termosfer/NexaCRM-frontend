import React, { useState } from 'react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/auth/forgot-password?email=${email}`);
      toast.success("Sıfırlama linki emailinizə göndərildi!");
    } catch {
      toast.error("Xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white w-full max-w-md p-10 rounded-[40px] shadow-2xl space-y-8 animate-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic">Şifrəni Bərpa Et</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Email ünvanınızı daxil edin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={20}/>
            <input 
              required type="email" 
              className="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold" 
              placeholder="Email ünvanınız"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl flex items-center justify-center">
            {loading ? "GÖNDƏRİLİR..." : "LİNKİ GÖNDƏR"} <Send size={16} className="ml-2"/>
          </button>
        </form>

        <Link to="/login" className="flex items-center justify-center text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
          <ArrowLeft size={14} className="mr-2"/> Giriş səhifəsinə qayıt
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;