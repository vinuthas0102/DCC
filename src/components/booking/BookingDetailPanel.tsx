import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Loader2, Send, X,
  MessageCircle, Paperclip, FileText,
} from 'lucide-react';
import { ChatDeliveryModePicker } from '../ui/ChatDeliveryModePicker';
import { BookingDTO, BookingServiceChatDTO } from '../../types';
import type { ChatDeliveryMode } from '../../types/quarters';
import { useUIStore } from '../../stores/uiStore';
import { bookingServiceRequestService } from '../../services/bookingServiceRequestService';
import { getBookingStatusConfig } from '../../utils/bookingFormatters';

// ── Props ───────────────────────────────────────────────────────────

interface BookingDetailPanelProps {
  booking: BookingDTO;
  userId: string;
  isManager?: boolean;
  isGovtOfficial?: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
  panelControls?: React.ReactNode;
}

export const BookingDetailPanel: React.FC<BookingDetailPanelProps> = ({
  booking, userId, isManager = false,
  onClose, onNavigate, panelControls,
}) => {
  const addToast = useUIStore((s) => s.addToast);
  const statusCfg = getBookingStatusConfig(booking.status);

  // Direct chat (booking-level)
  const [directChatInput, setDirectChatInput] = useState('');
  const [directChatFile, setDirectChatFile] = useState<File | null>(null);
  const directChatFileRef = useRef<HTMLInputElement>(null);
  const [directChats, setDirectChats] = useState<BookingServiceChatDTO[]>([]);
  const [sendingDirectChat, setSendingDirectChat] = useState(false);
  const [directChatMode, setDirectChatMode] = useState<ChatDeliveryMode[]>(['IN_APP']);

  const headerColor = (() => {
    const s = booking.status;
    if (['CHECKED_IN'].includes(s)) return 'bg-emerald-700';
    if (['CHECKED_OUT'].includes(s)) return 'bg-teal-700';
    if (['ALLOCATED', 'PROVISIONED'].includes(s)) return 'bg-blue-700';
    if (['CANCELLED', 'REJECTED'].includes(s)) return 'bg-rose-700';
    return 'bg-slate-700';
  })();

  useEffect(() => {
    bookingServiceRequestService.getServiceChats(booking.id)
      .then(setDirectChats).catch(() => {});
  }, [booking.id]);

  const handleSendDirectChat = async () => {
    const msg = directChatInput.trim();
    if (!msg && !directChatFile) return;
    setSendingDirectChat(true);
    try {
      const docUrls: string[] = [];
      const chat = await bookingServiceRequestService.addServiceChat(
        booking.id, userId, isManager ? 'manager' : 'employee', msg, docUrls,
        directChatMode[0] as BookingServiceChatDTO['deliveryMode'],
      );
      setDirectChats(prev => [...prev, chat]);
      setDirectChatInput('');
      setDirectChatFile(null);
    } catch {
      addToast({ type: 'error', message: 'Failed to send message' });
    } finally {
      setSendingDirectChat(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ── Colored header ── */}
      <div className={`flex items-center gap-2 px-3 py-2.5 sticky top-0 z-10 rounded-t-xl ${headerColor}`}>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-white truncate">#{booking.bookingNumber}</span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-xs font-semibold text-white/90 truncate">{booking.property?.name || 'Booking'}</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white shrink-0">{statusCfg.label}</span>
        <button
          onClick={() => onNavigate(booking.id)}
          className="flex items-center gap-1 text-[10px] font-medium text-white/80 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-all shrink-0"
        >
          <ExternalLink size={10} />Full
        </button>
        {panelControls}
      </div>

      {/* ── Booking Chat ── */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-1.5">
          <MessageCircle size={13} className="text-gray-400" />
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Booking Chat</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-gray-50 min-h-[100px]">
          {directChats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <Send size={14} className="text-gray-300" />
              </div>
              <div className="text-[12px] font-semibold text-gray-500">No messages yet</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Start the conversation below</div>
            </div>
          )}
          {directChats.map(msg => {
            const isMine = msg.authorRole === (isManager ? 'manager' : 'employee');
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] text-xs px-3 py-2 rounded-2xl leading-relaxed ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
                  {msg.message}
                  <div className={`text-[9px] mt-0.5 ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                    {isMine ? 'You' : (isManager ? 'Guest' : 'Manager')} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex-none border-t border-gray-100 px-4 py-3 bg-white">
          <ChatDeliveryModePicker value={directChatMode} onChange={setDirectChatMode} className="mb-2" />
          {directChatFile && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg mb-2">
              <FileText size={13} className="text-blue-500 shrink-0" />
              <span className="flex-1 min-w-0 text-[12px] font-medium text-blue-800 truncate">{directChatFile.name}</span>
              <button type="button" onClick={() => setDirectChatFile(null)} className="p-0.5 rounded text-blue-400 hover:text-red-500 transition-colors shrink-0"><X size={12} /></button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button type="button" onClick={() => directChatFileRef.current?.click()}
              className="flex-none p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors" title="Attach file">
              <Paperclip size={15} />
            </button>
            <input ref={directChatFileRef} type="file" accept="application/pdf,image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0] ?? null; setDirectChatFile(f); e.target.value = ''; }} />
            <textarea
              value={directChatInput}
              onChange={e => setDirectChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && directChatInput.trim()) { e.preventDefault(); handleSendDirectChat(); } }}
              rows={1}
              placeholder="Type a message… (Enter to send)"
              className="flex-1 px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white leading-relaxed transition-colors"
              style={{ minHeight: '40px', maxHeight: '80px' }}
            />
            <button onClick={handleSendDirectChat} disabled={!directChatInput.trim() || sendingDirectChat}
              className="flex-none p-2.5 rounded-xl bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
