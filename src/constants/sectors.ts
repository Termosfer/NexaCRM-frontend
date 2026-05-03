import { Plane, GraduationCap, Home, Car, Layout } from 'lucide-react';
import travel from "../assets/Gemini_Generated_Image_khpszkhpszkhpszk.png";
import education from "../assets/Gemini_Generated_Image_19bulh19bulh19bu.png";
import real_estate from "../assets/Gemini_Generated_Image_vo99u9vo99u9vo99.png";
import car from "../assets/Gemini_Generated_Image_bprtc8bprtc8bprt.png";
import login_img from "../assets/Gemini_Generated_Image_xns9zbxns9zbxns9.png"
export const SECTOR_CONFIG = {
  TURIZM: {
    name: 'Turizm Agentliyi',
    image: travel, 
    icon: Plane,
    color: 'text-blue-500',
    description: 'Dünyanı kəşf edən biznesinizi idarə edin.'
  },
  KURS: {
    name: 'Tədris Mərkəzi',
    image: education, 
    icon: GraduationCap,
    color: 'text-emerald-500',
    description: 'Gələcəyin mütəxəssislərini yetişdirin.'
  },
  EMLAK: {
    name: 'Daşınmaz Əmlak',
    image: real_estate,
    icon: Home,
    color: 'text-orange-500',
    description: 'Xəyalınızdakı mülkləri sahibinə qovuşdurun.'
  },
  AVTO: {
    name: 'Avtosalon',
    image: car,
    icon: Car,
    color: 'text-rose-500',
    description: 'Premium avto-təcrübəni rəqəmsallaşdırın.'
  },
  DEFAULT: {
    name: 'Nexa CRM',
    image: login_img,
    icon: Layout,
    color: 'text-slate-400',
    description: 'Biznesinizi rəqəmsal dünyada idarə edin.'
  }
} as const;

export type SectorKey = keyof typeof SECTOR_CONFIG;