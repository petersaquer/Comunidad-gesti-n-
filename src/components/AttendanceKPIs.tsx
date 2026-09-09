import React, { useMemo } from 'react';
import { Meeting, Resident } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Map, Award, Calendar as CalendarIcon } from 'lucide-react';

interface Props {
  meetings: Meeting[];
  residents: Resident[];
}

export const AttendanceKPIs: React.FC<Props> = ({ meetings, residents }) => {
  const kpis = useMemo(() => {
    if (meetings.length === 0 || residents.length === 0) return null;

    const totalMeetings = meetings.length;
    const totalResidents = residents.length;

    let totalAttendance = 0;
    const attendanceByBlock: Record<string, { totalPossible: number, attended: number }> = {};
    const attendanceByResident: Record<string, number> = {};

    residents.forEach(r => {
      if (!attendanceByBlock[r.block]) {
        attendanceByBlock[r.block] = { totalPossible: 0, attended: 0 };
      }
      attendanceByBlock[r.block].totalPossible += totalMeetings;
      attendanceByResident[r.id] = 0;
    });

    meetings.forEach(m => {
      totalAttendance += m.attendees.length;
      m.attendees.forEach(attId => {
        const resident = residents.find(r => r.id === attId || r.documentId === attId);
        if (resident) {
          if (attendanceByBlock[resident.block]) {
            attendanceByBlock[resident.block].attended += 1;
          }
          if (attendanceByResident[resident.id] !== undefined) {
            attendanceByResident[resident.id] += 1;
          }
        }
      });
    });

    const averageAttendance = (totalAttendance / (totalResidents * totalMeetings)) * 100;

    const blockData = Object.keys(attendanceByBlock).map(block => ({
      name: `Mz ${block}`,
      Tasa: Math.round((attendanceByBlock[block].attended / (attendanceByBlock[block].totalPossible || 1)) * 100)
    })).sort((a, b) => b.Tasa - a.Tasa);

    const bestBlock = blockData.length > 0 ? blockData[0].name : '-';

    return { totalMeetings, averageAttendance, blockData, bestBlock };
  }, [meetings, residents]);

  if (!kpis) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-6">
      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-500" />
        Panel de Rendimiento (KPIs de Asistencia)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Promedio Global</p>
            <p className="text-2xl font-black text-slate-800">{kpis.averageAttendance.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Asambleas</p>
            <p className="text-2xl font-black text-slate-800">{kpis.totalMeetings}</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Manzana más Activa</p>
            <p className="text-2xl font-black text-slate-800">{kpis.bestBlock}</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <h3 className="text-sm font-bold text-slate-600 mb-4">Participación por Manzana (%)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={kpis.blockData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="Tasa" radius={[4, 4, 0, 0]}>
              {kpis.blockData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
