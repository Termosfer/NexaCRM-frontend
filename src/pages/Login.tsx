import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  LogIn,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import api from "../api/axios";
import toast from "react-hot-toast";
import { SECTOR_CONFIG, type SectorKey } from "../constants/sectors";
import type { ApiError, AuthResponse, ValidationErrors } from "../types";
import type { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [sector, setSector] = useState<SectorKey>(() => {
    const saved = localStorage.getItem("pref_sector") as SectorKey;

    return saved && SECTOR_CONFIG[saved] ? saved : "DEFAULT";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    const checkSector = async () => {
      if (!formData.email || !formData.email.includes("@")) {
        setSector("DEFAULT");
        return;
      }

      try {
        const res = await api.get(`/auth/sector-info?email=${formData.email}`);
        const foundSector = res.data.sector as SectorKey;

        setSector(
          foundSector && SECTOR_CONFIG[foundSector] ? foundSector : "DEFAULT",
        );
      } catch {
        setSector("DEFAULT");
      }
    };

    const timer = setTimeout(checkSector, 600); 
    return () => clearTimeout(timer);
  }, [formData.email]);

  const handleChange = (field: "email" | "password", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ValidationErrors];
        return newErrors;
      });
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (data: typeof formData) =>
      api.post<AuthResponse>("/auth/login", data),
    onSuccess: (res) => {
      login(res.data.token, res.data);
      toast.success("Xoş gördük!");
      navigate("/");
    },
    onError: (err: AxiosError<ApiError>) => {
      toast.error(err.response?.data?.message || "Email və ya şifrə yanlışdır");
      setErrors({ email: " ", password: " " }); // Xanaları qızartmaq üçün
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: ValidationErrors = {};
    if (!formData.email) newErrors.email = "Email daxil edilməlidir";
    if (!formData.password) newErrors.password = "Şifrə daxil edilməlidir";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    mutate(formData);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      <div className="hidden lg:flex lg:w-3/5 relative h-screen bg-slate-900">
        <AnimatePresence mode="wait">
          <motion.img
            key={sector}
            src={SECTOR_CONFIG[sector].image}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Sector BG"
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-slate-900/50 "></div>

        <div className="relative z-10 p-20 flex flex-col justify-between h-full text-white w-full">
          <h2 className="text-3xl font-black italic tracking-tighter text-indigo-400">
            NexaCRM
          </h2>

          <motion.div
            key={sector + "text"}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <h1 className="text-6xl font-black leading-tight tracking-tighter mb-4">
              {sector === "DEFAULT"
                ? "Sisteminizə giriş edin."
                : SECTOR_CONFIG[sector].description}
            </h1>
            <p className="text-indigo-100 text-sm font-bold uppercase tracking-[0.3em] opacity-80">
              {sector !== "DEFAULT"
                ? `${SECTOR_CONFIG[sector].name} İDARƏETMƏ PANELİ`
                : "Professional SaaS Platform"}
            </p>
          </motion.div>

          <div className="flex items-center space-x-3 text-[10px] font-black opacity-40 uppercase tracking-[0.4em]">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>AES-256 Cloud Security Active</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-[#fcfdfe]">
        <div className="w-full max-w-sm space-y-10">
          <div className="text-center lg:text-left">
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic">
              Giriş
            </h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
              Nexa Intelligence sisteminə daxil olun
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Email Ünvanı
              </label>
              <div className="relative group">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? "text-rose-400" : "text-slate-300 group-focus-within:text-indigo-500"}`}
                  size={16}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full pl-11 pr-4 py-4 rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm border-2
                    ${errors.email ? "border-rose-100 bg-rose-50/30" : "border-transparent bg-slate-50 focus:border-indigo-100 focus:bg-white"}
                  `}
                  placeholder="mail@shirket.com"
                />
              </div>
              {errors.email && errors.email !== " " && (
                <p className="text-[9px] text-rose-500 font-bold ml-2 mt-1 flex items-center">
                  <AlertCircle size={10} className="mr-1" /> {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Şifrə
                </label>
                <Link
                  to="/forgot-password"
                  title="Şifrəni unutmusan?"
                  className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-tighter transition-colors"
                >
                  Şifrəni unutmusan?
                </Link>
              </div>
              <div className="relative group">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? "text-rose-400" : "text-slate-300 group-focus-within:text-indigo-500"}`}
                  size={16}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={`w-full pl-11 pr-12 py-4 rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm border-2
                    ${errors.password ? "border-rose-100 bg-rose-50/30" : "border-transparent bg-slate-50 focus:border-indigo-100 focus:bg-white"}
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && errors.password !== " " && (
                <p className="text-[9px] text-rose-500 font-bold ml-2 mt-1 flex items-center">
                  <AlertCircle size={10} className="mr-1" /> {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center group"
            >
              {isPending ? (
                <RefreshCcw className="animate-spin mr-2" size={16} />
              ) : (
                "SİSTEMƏ DAXİL OL"
              )}
              {!isPending && (
                <LogIn
                  size={16}
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Hesabınız yoxdur?
              <Link
                to="/register"
                className="text-indigo-600 font-black border-b-2 border-indigo-100 ml-1 pb-0.5 hover:border-indigo-600 transition-all"
              >
                İndi Yaradın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
