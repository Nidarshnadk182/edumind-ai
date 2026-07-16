'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function WeeklyActivityChart({ data }: { data: { day: string; minutes: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0fa" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8d99cf' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#8d99cf' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #dde1f2', fontSize: 13 }} />
        <Line type="monotone" dataKey="minutes" stroke="#7d4bc4" strokeWidth={2.5} dot={{ r: 3, fill: '#7d4bc4' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SubjectMasteryChart({ data }: { data: { subject: string; mastery: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0fa" vertical={false} />
        <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#8d99cf' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#8d99cf' }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #dde1f2', fontSize: 13 }} />
        <Bar dataKey="mastery" fill="#9769d8" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
