import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import api from "../api/axios";
import toast from "react-hot-toast";
import { SECTOR_CONFIG } from "../constants/sectors";
import RegisterBG from "../assets/register.png";
import type {
  ApiError,
  RegisterRequest,
  SectorKey,
  ValidationErrors,
} from "../types";
import type { AxiosError, AxiosResponse } from "axios";

const Register: React.FC = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [selectedSector, setSelectedSector] = useState<SectorKey>("DEFAULT");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    businessSector: "TURIZM" as SectorKey,
  });

  
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ValidationErrors];
        return newErrors;
      });
    }
  };

  // --- REACT QUERY MUTATION ---
  const { mutate, isPending } = useMutation<
    AxiosResponse,
    AxiosError<ApiError>,
    RegisterRequest
  >({
    mutationFn: (payload: RegisterRequest) =>
      api.post("/auth/register", payload),
    onSuccess: (_res, variables) => {
      localStorage.setItem("pref_sector", variables.businessSector);
      toast.success("Uğurlu qeydiyyat!");
      navigate("/login");
    },
    onError: (err: AxiosError<ApiError>) => {
      toast.error(err.response?.data?.message || "Xəta baş verdi");
    },
  });

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Ad və Soyad mütləqdir";
    if (!formData.companyName.trim())
      newErrors.companyName = "Şirkət adı mütləqdir";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email))
      newErrors.email = "Düzgün e-poçt daxil edin";

    const passRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passRegex.test(formData.password)) {
      newErrors.password =
        "Şifrə: 8+ simvol, böyük hərf, rəqəm və xüsusi işarə olmalıdır";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      businessSector: selectedSector === "DEFAULT" ? "TURIZM" : selectedSector,
    };

    mutate(payload);
  };

  const getActiveImage = () => {
    if (selectedSector === "DEFAULT") return RegisterBG;
    return SECTOR_CONFIG[selectedSector].image;
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      <div className="hidden lg:flex lg:w-3/5 relative h-screen bg-slate-900 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={selectedSector}
            src={getActiveImage()}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Sector"
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-slate-900/40"></div>

        <div className="relative z-10 p-20 flex flex-col justify-between h-full text-white w-full">
          <h2 className="text-3xl font-black italic tracking-tighter text-indigo-400">
            NexaCRM
          </h2>

          <motion.div
            key={selectedSector + "text"}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-6xl font-black leading-tight tracking-tighter mb-4">
              {selectedSector === "DEFAULT"
                ? "Biznesinizi gələcəyə daşıyın."
                : SECTOR_CONFIG[selectedSector].description}
            </h1>
            <p className="text-indigo-100 text-sm font-bold uppercase tracking-[0.3em] opacity-80 text-wrap w-md">
              Sizin sahənizə özəl hazırlanmış rəqəmsal idarəetmə paneli.
            </p>
          </motion.div>

          <div className="flex items-center space-x-3 text-[10px] font-black opacity-40 uppercase tracking-[0.4em]">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Secure Enterprise Architecture</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-[#fcfdfe] overflow-y-auto">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic">
              Yeni Hesab
            </h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
              Lütfən məlumatları doldurun
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="AD SOYAD"
                error={errors.fullName}
                icon={<User size={14} />}
                value={formData.fullName}
                onChange={(v) => handleChange("fullName", v)}
              />
              <FormInput
                label="ŞİRKƏT"
                error={errors.companyName}
                icon={<Building2 size={14} />}
                value={formData.companyName}
                onChange={(v) => handleChange("companyName", v)}
              />
            </div>

            <FormInput
              label="E-POÇT"
              type="email"
              error={errors.email}
              icon={<Mail size={14} />}
              value={formData.email}
              onChange={(v) => handleChange("email", v)}
            />

            <div className="relative">
              <FormInput
                label="ŞİFRƏ"
                type={showPassword ? "text" : "password"}
                error={errors.password}
                icon={<Lock size={14} />}
                value={formData.password}
                onChange={(v) => handleChange("password", v)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-7.5 text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Biznes Sahəniz
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SECTOR_CONFIG) as SectorKey[])
                  .filter((k) => k !== "DEFAULT")
                  .map((key) => {
                    const s = SECTOR_CONFIG[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedSector(key);
                          handleChange("businessSector", key);
                        }}
                        className={`cursor-pointer flex items-center p-2.5 rounded-xl border-2 transition-all gap-3 ${selectedSector === key ? "border-indigo-600 bg-indigo-50/50 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200"}`}
                      >
                        <div className={`p-1.5 rounded-lg bg-white shadow-sm ${s.color}`}>
                          <s.icon size={14} />
                        </div>
                        <span className={`text-[9px] font-black uppercase ${selectedSector === key ? "text-indigo-600" : "text-slate-500"}`}>
                          {s.name}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className={`cursor-pointer w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center group mt-4 ${isPending ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isPending ? "YARADILIR..." : "QEYDİYYATI TAMAMLA"}{" "}
              {!isPending && (
                <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Hesabınız var?{" "}
            <Link to="/login" className="text-indigo-600 font-black hover:underline">
              Daxil olun
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

interface FormInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  error?: string;
  type?: string;
}

const FormInput: React.FC<FormInputProps> = ({ label, value, onChange, icon, error, type = "text" }) => (
  <div className="space-y-1 w-full">
    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border-2 rounded-xl outline-none font-bold text-slate-700 transition-all text-xs
          ${error ? "border-rose-200 bg-rose-50/30" : "border-transparent focus:border-indigo-100 focus:bg-white"}
        `}
      />
    </div>
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-[9px] text-rose-500 font-bold flex items-center ml-1"
        >
          <AlertCircle size={10} className="mr-1" /> {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

export default Register;