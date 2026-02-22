"use client";

import { X, Calendar, Activity, Stethoscope } from "lucide-react";
import Image from "next/image";

const PARTICIPANT_PHOTOS: Record<string, string> = {
  "Lena Watkins":  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face&auto=format",
  "Marcus Nguyen": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face&auto=format",
  "Amara Osei":    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=face&auto=format",
  "Jordan Price":  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face&auto=format",
  "Priya Sharma":  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face&auto=format",
};

const PLAN_STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "under-review": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  expired: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export interface ParticipantModalData {
  id: string;
  ndis_number: string | null;
  first_name: string;
  last_name: string;
  primary_diagnosis: string | null;
  planStatus: string;
  nextSession: string | null;
  lastActivity: string | null;
}

interface Props {
  participant: ParticipantModalData;
  onClose: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function ParticipantPreviewModal({ participant, onClose }: Props) {
  const fullName = `${participant.first_name} ${participant.last_name}`;
  const photo = PARTICIPANT_PHOTOS[fullName];
  const initials = `${participant.first_name[0]}${participant.last_name[0]}`;
  const planStyle = PLAN_STATUS_STYLES[participant.planStatus] ?? PLAN_STATUS_STYLES.expired;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — navy gradient */}
        <div
          className="p-6 relative"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 flex-shrink-0">
              {photo ? (
                <Image
                  src={photo}
                  alt={fullName}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{fullName}</h2>
              {participant.ndis_number && (
                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded bg-white/20 text-xs font-mono text-white/90">
                  {participant.ndis_number}
                </span>
              )}
              <p className="text-white/70 text-sm mt-1">{participant.primary_diagnosis ?? "No diagnosis recorded"}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <InfoRow
            icon={<Stethoscope className="w-4 h-4 text-indigo-500" />}
            label="Primary Diagnosis"
            value={participant.primary_diagnosis ?? "—"}
          />

          <InfoRow
            icon={
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planStyle}`}>
                {participant.planStatus.replace("-", " ")}
              </span>
            }
            label="Plan Status"
            value=""
            valueNode={
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planStyle}`}>
                {participant.planStatus.charAt(0).toUpperCase() + participant.planStatus.slice(1).replace("-", " ")}
              </span>
            }
          />

          <InfoRow
            icon={<Calendar className="w-4 h-4 text-emerald-500" />}
            label="Next Session"
            value={participant.nextSession ? formatDate(participant.nextSession) : "None scheduled"}
          />

          <InfoRow
            icon={<Activity className="w-4 h-4 text-slate-400" />}
            label="Last Activity"
            value={timeAgo(participant.lastActivity)}
          />
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            View Full Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueNode,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueNode?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
      <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        {valueNode ?? (
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
