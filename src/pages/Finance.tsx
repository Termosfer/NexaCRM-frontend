import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Wallet, TrendingDown, TrendingUp, DollarSign, Plus, X, 
  Trash2, Loader2,  PieChart as PieIcon,
  Briefcase, Zap, ShieldCheck, CreditCard, Building2, Users, Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';
import api from '../api/axios';
import type { DashboardStats, Expense, ExpenseCategory } from '../types';
import { useAuth } from '../context/AuthContext';


interface CreateExpensePayload {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}
interface StatCardProps {
  title: string;
  value?: number; // Backend-dən gəlmədiyi anlarda undefined ola bilər
  icon: React.ReactNode; // İkon üçün düzgün tip
  color: string;
  isCurrency?: boolean;
}

const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string, color: string, bg: string, icon: React.ElementType }> = {
  SALARY: { label: 'Maaşlar', color: 'text-blue-600', bg: 'bg-blue-100', icon: Users },
  MARKETING: { label: 'Reklam & PR', color: 'text-pink-600', bg: 'bg-pink-100', icon: TrendingUp },
  RENT: { label: 'İcarə', color: 'text-orange-600', bg: 'bg-orange-100', icon: Building2 },
  OFFICE: { label: 'Ofis Xərcləri', color: 'text-teal-600', bg: 'bg-teal-100', icon: Briefcase },
  UTILITIES: { label: 'Kommunal', color: 'text-cyan-600', bg: 'bg-cyan-100', icon: Zap },
  TAX: { label: 'Vergi', color: 'text-rose-600', bg: 'bg-rose-100', icon: ShieldCheck },
  OTHER: { label: 'Digər', color: 'text-slate-600', bg: 'bg-slate-100', icon: CreditCard }
};

const PIE_COLORS =['#3b82f6', '#ec4899', '#f97316', '#14b8a6', '#06b6d4', '#e11d48', '#64748b'];

const Finance: React.FC = () => {
  const { user } = useAuth();
  const ORG_ID = user?.organizationId || "";
  const USER_ID = user?.id || "";
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '', amount: '', category: 'OTHER' as ExpenseCategory, date: new Date().toISOString().split('T')[0]
  });

  // --- DATA FETCHING ---
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['stats', ORG_ID],
    queryFn: () => api.get(`/dashboard/stats/${ORG_ID}`).then(res => res.data),
    enabled: !!ORG_ID
  });

  const { data: rawExpenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', ORG_ID],
    queryFn: () => api.get(`/finance/expenses/${ORG_ID}`).then(res => res.data),
    enabled: !!ORG_ID
  });

  const expenses = Array.isArray(rawExpenses) ? rawExpenses :[];

  // Qrafik üçün datalar
  const chartData = (Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map(cat => {
    const total = expenses.filter(e => e.category === cat).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return { name: EXPENSE_CATEGORIES[cat].label, value: total };
  }).filter(d => d.value > 0);

  // --- MUTATIONS ---
  const createExpenseMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) => api.post(`/finance/expenses?orgId=${ORG_ID}&userId=${USER_ID}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey:['stats'] });
      setIsModalOpen(false);
      setExpenseForm({ title: '', amount: '', category: 'OTHER', date: new Date().toISOString().split('T')[0] });
      toast.success("Xərc əlavə edildi!", { icon: '💸' });
    },
    onError: () => toast.error("Xəta baş verdi.")
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success("Tranzaksiya silindi!");
    },
    onError: () => toast.error("Silmək mümkün olmadı.")
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return toast.error("Bütün xanaları doldurun");
    createExpenseMutation.mutate({ ...expenseForm, amount: Number(expenseForm.amount) });
  };

  if (statsLoading || expensesLoading) return <div className="h-screen flex items-center justify-center bg-[#fbfcfd]"><Loader2 className="animate-spin text-indigo-600 size-12" /></div>;

  return (
    <div className="p-8 space-y-8 bg-[#fbfcfd] min-h-screen font-sans">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic">Maliyyə Paneli</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Şirkətin gəlir və xərc hesabatı</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 transition-all active:scale-95 flex items-center">
          <Plus size={18} className="mr-2" /> Xərc Çıx
        </button>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Ümumi Gəlir" value={stats?.totalExpectedRevenue} icon={<TrendingUp size={20} />} color="emerald" isCurrency />
        <StatCard title="Ümumi Xərc" value={stats?.totalExpense} icon={<TrendingDown size={20} />} color="rose" isCurrency />
        <StatCard title="Xalis Mənfəət" value={stats?.netProfit} icon={<Wallet size={20} />} color="indigo" isCurrency />
        
        <div className="bg-slate-900 p-8 rounded-4xl shadow-xl text-white flex flex-col justify-between group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 rounded-2xl"><DollarSign size={20} className="text-emerald-400" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Marja</span>
          </div>
          <div>
            <h4 className="text-4xl font-black tracking-tighter">{stats?.profitMargin?.toFixed(1) || 0}%</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Qazanc Faizi</p>
          </div>
        </div>
      </div>

      {/* 3. KOMPAKT XƏRCLƏR CƏDVƏLİ */}
      <div className="bg-white rounded-4xl shadow-xl shadow-slate-200/20 border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 flex items-center"><Receipt className="mr-3 text-rose-500" size={20}/> Əməliyyat Tarixçəsi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Təyinat / Başlıq</th>
                <th className="px-6 py-4">Kateqoriya</th>
                <th className="px-6 py-4">Tarix</th>
                <th className="px-6 py-4 text-right">Məbləğ</th>
                <th className="px-6 py-4 text-center w-20">İşləm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-slate-400 italic font-bold tracking-widest uppercase text-xs">Hələ heç bir xərc qeydə alınmayıb</td></tr>
              ) : (
                expenses.map((exp: Expense) => {
                  const catConfig = EXPENSE_CATEGORIES[exp.category] || EXPENSE_CATEGORIES.OTHER;
                  const Icon = catConfig.icon;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-sm mb-0.5">{exp.title}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {exp.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${catConfig.bg} ${catConfig.color}`}>
                          <Icon size={12} className="mr-1.5" /> {catConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString('az-AZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right font-black font-mono text-rose-600 text-lg whitespace-nowrap">
                        -${Number(exp.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => deleteExpenseMutation.mutate(exp.id)} 
                          disabled={deleteExpenseMutation.isPending}
                          className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm active:scale-90 disabled:opacity-50"
                          title="Sil"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. QRAFİKLƏR (Alt hissədə) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
             <PieIcon className="mr-3 text-indigo-500" size={20} /> Xərc Kateqoriyaları
           </h3>
           <div className="h-75 w-full">
             {chartData.length === 0 ? (
               <div className="h-full flex items-center justify-center text-slate-400 italic font-bold">Qrafik üçün data yoxdur</div>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={chartData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                     {chartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                   </Pie>
                   <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                   <Legend verticalAlign="bottom" iconType="circle" />
                 </PieChart>
               </ResponsiveContainer>
             )}
           </div>
        </div>
        
        <div className="bg-slate-50 p-8 rounded-4xl border border-slate-200/50 flex flex-col items-center justify-center text-center">
          <ShieldCheck size={56} className="text-slate-300 mb-6" />
          <h3 className="text-xl font-black text-slate-800 mb-2">Güvənli Maliyyə</h3>
          <p className="text-xs font-bold text-slate-500 max-w-xs leading-relaxed">Bütün tranzaksiyalarınız AES-256 standartı ilə şifrələnir və təhlükəsiz qorunur.</p>
        </div>
      </div>

      {/* --- ADD EXPENSE MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[40px] w-full max-w-sm p-10 shadow-2xl border border-rose-50">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black  tracking-tighter italic text-rose-600">Yeni Xərc Qeydi</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleAddExpense} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Başlıq</label>
                  <input required className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/20 font-bold text-sm" placeholder="Məs: Facebook Reklamı" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Məbləğ ($)</label>
                    <input required type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/20 font-black text-sm text-rose-600" placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Tarix</label>
                    <input required type="date" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/20 font-bold text-xs text-slate-600" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Kateqoriya</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/20 font-bold text-xs cursor-pointer text-slate-700" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value as ExpenseCategory})}>
                    {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map(k => (
                      <option key={k} value={k}>{EXPENSE_CATEGORIES[k].label}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" disabled={createExpenseMutation.isPending} className="w-full bg-rose-500 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-rose-600 transition-all active:scale-95 mt-4 disabled:opacity-50">
                  {createExpenseMutation.isPending ? 'ƏLAVƏ EDİLİR...' : 'XƏRCİ TƏSDİQLƏ'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Köməkçi StatCard
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, isCurrency }) => (
  <div className={`bg-white p-8 rounded-4xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-500`}>
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform`}>{icon}</div>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <h4 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tighter truncate">
        {isCurrency ? '$' : ''}{(value || 0).toLocaleString()}
      </h4>
    </div>
  </div>
);

export default Finance;