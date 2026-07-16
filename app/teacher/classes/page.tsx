import { Users, Plus, Upload } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CLASSES = [
  { name: 'MBA Finance Elective — Sem 2', code: 'FIN-2528', students: 42, subject: 'Corporate Finance' },
  { name: 'Derivatives & Risk Management', code: 'DER-1190', students: 38, subject: 'Derivatives' },
];

export default function TeacherClassesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50 flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600 dark:text-purple-300" /> Classes
          </h1>
          <p className="text-sm text-navy-500 dark:text-lavender-400">Manage your classes and study material.</p>
        </div>
        <Button><Plus className="h-4 w-4" /> Create class</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {CLASSES.map((c) => (
          <Card key={c.code}>
            <CardTitle>{c.name}</CardTitle>
            <CardDescription>{c.subject}</CardDescription>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-xs text-navy-400 dark:text-lavender-500">Class code</p>
                <p className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-300">{c.code}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-navy-400 dark:text-lavender-500">Students</p>
                <p className="text-sm font-semibold text-navy-800 dark:text-lavender-100">{c.students}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Upload className="h-3.5 w-3.5" /> Upload material
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
