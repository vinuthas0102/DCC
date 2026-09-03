import React, { useEffect, useRef, useState } from 'react';
import {
  X, MessageSquare, Send, Loader2,
  AlertTriangle, Wrench, RefreshCw, Ban, ArrowUpCircle, HelpCircle,
  Paperclip, FileText,
} from 'lucide-react';
import { BookingServiceRequestDTO, BookingServiceChatDTO } from '../../types';

const SERVICE_CONFIG: Record<string, { label: string; Icon: React.FC<{ size?: number; className?: string }>; color: string; bg: string; border: string }> = {
  GRIEVANCE:            { label: 'Grievance',            Icon: AlertTriangle,  color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  MAINTENANCE:          { label: 'Maintenance',          Icon: Wrench,         color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  EXTENSION:            { label: 'Extension Request',    Icon: RefreshCw,      color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  CANCELLATION_REQUEST: { label: 'Cancellation Request', Icon: Ban,            color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-200' },
  UPGRADE:              { label: 'Room Upgrade Request', Icon: ArrowUpCircle,  color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-200' },
  GENERAL:              { label: 'General Enquiry',      Icon: HelpCircle,     color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200' },
};

const URGENCY_CLS: Record<string, string> = {
  HIGH:   'bg-red-100 text-red-700 border border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border border-amber-200',
  LOW:    'bg-gray-100 text-gray-600 border border-gray-200',
};

const STATUS_CLS: Record<string, string> = {
  OPEN:        'bg-amber-100 text-amber-700 border border-amber-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border border-blue-200',
  RESOLVED:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  CLOSED:      'bg-gray-100 text-gray-600 border border-gray-200',
};

interface ServiceChatRightPanelProps {
  service: BookingServiceRequestDTO;
  messages: BookingServiceChatDTO[];
  messageInput: string;
  isSending: boolean;
  isManager: boolean;
  panelControls?: React.ReactNode;
  attachFile?: File | null;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onAttachFileChange?: (f: File | null) => void;
  onSend: () => void;
}

export const ServiceChatRightPanel: React.FC<ServiceChatRightPanelProps> = ({
  service,
  messages,
  messageInput,
  isSending,
  isManager,
  panelControls,
  attachFile,
  onClose,
  onInputChange,
  onAttachFileChange,
  onSend,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cfg = SERVICE_CONFIG[service.serviceType] ?? SERVICE_CONFIG.GENERAL;
  const { Icon } = cfg;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prevCount, setPrevCount] = useState(messages.length);

  useEffect(() => {
    if (messages.length !== prevCount) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setPrevCount(messages.length);
    }
  }, [messages.length, prevCount]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [service.id]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [service.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messageInput.trim() && !isSending) onSend();
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.border} border`}>
            <Icon size={14} className={cfg.color} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-900 leading-tight truncate max-w-[200px]">
              {service.subject || cfg.label}
            </p>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                {cfg.label}
              </span>
              {service.urgencyLevel && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${URGENCY_CLS[service.urgencyLevel] ?? ''}`}>
                  {service.urgencyLevel}
                </span>
              )}
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CLS[service.requestStatus] ?? ''}`}>
                {service.requestStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {panelControls}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Context strip */}
      {(service.remarks || service.eoNotes) && (
        <div className={`px-4 py-2.5 border-b border-gray-100 ${cfg.bg} shrink-0`}>
          {service.remarks && (
            <p className="text-[11px] text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-500 text-[9px] uppercase tracking-wide mr-1">Remark:</span>
              {service.remarks}
            </p>
          )}
          {service.eoNotes && (
            <p className="text-[11px] text-gray-700 leading-relaxed mt-1">
              <span className="font-semibold text-gray-500 text-[9px] uppercase tracking-wide mr-1">Manager Note:</span>
              {service.eoNotes}
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <div className="w-12 h-12 rounded-full bg-teal-50 border-2 border-dashed border-teal-200 flex items-center justify-center">
              <MessageSquare size={20} className="text-teal-300" />
            </div>
            <p className="text-sm text-gray-400 font-medium">No messages yet</p>
            <p className="text-xs text-gray-300 text-center max-w-[180px]">
              Start the conversation about this service request
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMine = msg.authorRole === (isManager ? 'manager' : 'employee');
              const prevMsg = messages[i - 1];
              const showDateSep =
                i === 0 ||
                formatDate(msg.createdAt) !== formatDate(prevMsg.createdAt);

              return (
                <React.Fragment key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-2 my-2">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">
                        {formatDate(msg.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] space-y-0.5`}>
                      {!isMine && (
                        <p className="text-[9px] font-semibold text-gray-400 px-1">
                          {isManager ? 'Occupant' : 'Manager'}
                        </p>
                      )}
                      <div className={`text-[12px] px-3 py-2 rounded-2xl leading-relaxed ${
                        isMine
                          ? 'bg-teal-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        {msg.message}
                      </div>
                      <p className={`text-[9px] px-1 ${isMine ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
        {/* Attached file indicator */}
        {attachFile && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg mb-2">
            <FileText size={12} className="text-teal-500 shrink-0" />
            <span className="flex-1 min-w-0 text-[11px] font-medium text-teal-800 truncate">{attachFile.name}</span>
            <button
              type="button"
              onClick={() => onAttachFileChange?.(null)}
              className="p-0.5 rounded text-teal-400 hover:text-red-500 transition-colors shrink-0"
            >
              <X size={11} />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          {onAttachFileChange && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-none p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-colors mb-0.5"
                title="Attach file"
              >
                <Paperclip size={13} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0] ?? null; onAttachFileChange(f); e.target.value = ''; }}
              />
            </>
          )}
          <textarea
            ref={textareaRef}
            rows={2}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            value={messageInput}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 bg-gray-50 transition-colors placeholder-gray-400"
          />
          <button
            onClick={onSend}
            disabled={isSending || (!messageInput.trim() && !attachFile)}
            className="flex items-center justify-center w-8 h-8 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0 mb-0.5"
            title="Send"
          >
            {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
};
