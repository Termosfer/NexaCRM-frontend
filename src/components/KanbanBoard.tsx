import React, {  useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

import { 
  X, GripVertical, Plus, Loader2,
  CircleDot, MessageSquare, Star, Zap, CheckCircle, XCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Lead, Customer, LeadStatus, PageResponse } from '../types';
import { useAuth } from '../context/AuthContext';

interface CreateLeadPayload {
  title: string;
  amount: number;
  status: LeadStatus;
  customerId: string;
  organizationId: string;
}

const COLUMN_DEFS: Record<LeadStatus, { title: string; color: string; bg: string; icon: React.ElementType }> = {
  NEW: { title: 'Yeni', color: 'text-slate-600', bg: 'bg-slate-100', icon: CircleDot },
  CONTACTED: { title: 'Əlaqə', color: 'text-blue-600', bg: 'bg-blue-100', icon: MessageSquare },
  QUALIFIED: { title: 'Uyğun', color: 'text-purple-600', bg: 'bg-purple-100', icon: Star },
  NEGOTIATION: { title: 'Danışıq', color: 'text-orange-600', bg: 'bg-orange-100', icon: Zap },
  WON: { title: 'Uğurlu', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle },
  LOST: { title: 'Uğursuz', color: 'text-rose-600', bg: 'bg-rose-100', icon: XCircle },
};

const KanbanBoard: React.FC = () => {
  const { user } = useAuth();
  const ORG_ID = user?.organizationId || "";
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newLead, setNewLead] = useState({ 
    title: '', amount: '', customerId: '', status: 'NEW' as LeadStatus 
  });

  // --- DATA FETCHING ---
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey:['leads', ORG_ID],
    queryFn: () => api.get(`/leads/org/${ORG_ID}`).then(res => res.data),
    enabled: !!ORG_ID
  });

  const { data: customersPage, isLoading: custLoading } = useQuery<PageResponse<Customer>>({
    queryKey:['customers', ORG_ID, 'all'],
    queryFn: () => api.get(`/customers/org/${ORG_ID}?size=100`).then(res => res.data),
    enabled: !!ORG_ID
  });
  
  const customers = customersPage?.content ||[];

  // --- MUTATIONS ---
  const createLeadMutation = useMutation({
    mutationFn: (payload: CreateLeadPayload) => api.post<Lead>('/leads', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey:['stats'] });
      setIsModalOpen(false);
      setNewLead({ title: '', amount: '', customerId: '', status: 'NEW' });
      toast.success("Yeni satış yaradıldı!");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: LeadStatus }) => 
      api.patch(`/leads/${id}/status?status=${status}`),
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
      
    },
    onError: () => {
      
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.error("Sistem xətası: Status yenilənmədi");
    }
  });

  // --- HANDLERS ---
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.customerId) return toast.error("Müştəri seçin!");
    createLeadMutation.mutate({ 
      title: newLead.title, amount: Number(newLead.amount), status: newLead.status, 
      customerId: newLead.customerId, organizationId: ORG_ID 
    });
  };

 
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as LeadStatus;

   
    queryClient.setQueryData(['leads', ORG_ID], (oldLeads: Lead[] | undefined) => {
      if (!oldLeads) return[];
      
      
      const draggedItem = oldLeads.find(l => l.id === draggableId);
      if (!draggedItem) return oldLeads;

      const filteredLeads = oldLeads.filter(l => l.id !== draggableId);
      filteredLeads.push({ ...draggedItem, status: newStatus });
      
      return filteredLeads;
    });

    updateStatusMutation.mutate({ id: draggableId, status: newStatus });
  };

  if (leadsLoading || custLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 size-12" /></div>;

  return (
    <div className="h-screen w-full bg-[#fbfcfd] flex flex-col overflow-hidden font-sans">
      
      
      <div className="px-10 py-8 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Satış Axını</h1>
          <p className="text-slate-400 text-xs font-bold uppercase mt-1 tracking-widest font-mono">Nexa Pipeline v3.0</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 flex items-center">
          <Plus size={18} className="mr-2" /> Yeni Satış
        </button>
      </div>

      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto px-10 pb-10 flex gap-6 items-start no-scrollbar">
          {(Object.keys(COLUMN_DEFS) as LeadStatus[]).map(statusKey => {
            const col = COLUMN_DEFS[statusKey];
            const columnLeads = leads.filter(l => l.status === statusKey);

            return (
              <Droppable key={statusKey} droppableId={statusKey}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps} 
                    className={`w-72 shrink-0 rounded-[28px] p-4 flex flex-col min-h-137.5 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-indigo-50/50 ring-2 ring-indigo-200' : 'bg-slate-100/50 border-2 border-transparent'}`}
                  >
                    
                    <div className="flex items-center justify-between mb-4 px-2 shrink-0">
                      <div className={`flex items-center space-x-2 font-black text-[10px] uppercase tracking-widest ${col.color}`}>
                        <col.icon size={16} />
                        <span>{col.title}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-slate-100">{columnLeads.length}</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                      {columnLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, dragSnapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                             
                              style={provided.draggableProps.style}
                              className={`bg-white p-5 rounded-2xl border-b-2 border-slate-100 select-none ${dragSnapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500 z-50 opacity-90' : 'shadow-sm hover:border-indigo-200'}`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${col.color} bg-slate-50`}>Lead</span>
                                <GripVertical className="size-4 text-slate-300 hover:text-indigo-400" />
                              </div>
                              
                              <h4 className="font-bold text-slate-800 text-sm leading-snug mb-5">{lead.title}</h4>
                              
                              <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center text-[10px] font-bold text-slate-400">
                                  <div className="size-6 bg-slate-50 rounded-lg flex items-center justify-center mr-2 border border-slate-100 text-slate-500 font-black">
                                    {lead.customer?.firstName[0]}
                                  </div>
                                  {lead.customer?.firstName}
                                </div>
                                <span className="text-sm font-black text-slate-900 tracking-tighter">${lead.amount?.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-1000 p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic ">Yeni Satış</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full transition"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleAddLead} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">SATIŞ MÖVZUSU</label>
                <input required className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" placeholder="Məs: Ofis mebeli alışı" value={newLead.title} onChange={e => setNewLead({...newLead, title: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">MÜŞTƏRİ</label>
                <select required className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold cursor-pointer appearance-none" value={newLead.customerId} onChange={e => setNewLead({...newLead, customerId: e.target.value})}>
                  <option value="">Siyahıdan seçin...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">MƏBLƏĞ ($)</label>
                <input required type="number" className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" placeholder="0.00" value={newLead.amount} onChange={e => setNewLead({...newLead, amount: e.target.value})} />
              </div>

              <button type="submit" disabled={createLeadMutation.isPending} className="w-full bg-indigo-600 text-white p-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 mt-4 disabled:opacity-50">
                {createLeadMutation.isPending ? 'YARADILIR...' : 'SATIŞI BAŞLAT'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;