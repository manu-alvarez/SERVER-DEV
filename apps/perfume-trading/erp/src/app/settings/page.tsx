'use client';

import React, { useState } from 'react';
import { Building2, Palette, Users, Database, Save, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Settings Section ───
function SettingsSection({
  icon: Icon, title, description, children, defaultOpen = true,
}: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <Card padding={false}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#FAF9F8] dark:hover:bg-[#222] transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#F3F2F1] dark:bg-[#2a2a2a] flex items-center justify-center">
            <Icon size={20} className="text-[#f43f5e] dark:text-[#fb7185]" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-[#323130] dark:text-[#e0e0e0]">{title}</h3>
            <p className="text-[11px] text-[#605E5C] dark:text-[#888]">{description}</p>
          </div>
        </div>
        <ChevronRight size={18} className={cn('text-[#605E5C] transition-transform', isOpen && 'rotate-90')} />
      </button>
      {isOpen && <div className="px-6 pb-6 border-t border-[#EDEBE9] dark:border-[#333] pt-4">{children}</div>}
    </Card>
  );
}

export default function SettingsPage() {
  const dbStatus = 'Conectado a SQLite via Prisma';
  const dbUrl = process.env.DATABASE_URL || 'file:./erp.db';

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-[#323130] dark:text-[#e0e0e0]">Configuración</h2>
        <p className="text-xs text-[#605E5C] dark:text-[#888]">Administración del sistema y preferencias</p>
      </div>

      <div className="space-y-4">
        {/* Company Profile */}
        <SettingsSection icon={Building2} title="Perfil de Empresa" description="Información legal y datos fiscales">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Razón Social" defaultValue="Perfume Trading SL" />
            <Input label="CIF/NIF" defaultValue="B-12345678" />
            <Input label="Dirección" defaultValue="Calle Mayor 42, 28001 Madrid" className="col-span-2" />
            <Input label="Teléfono" defaultValue="+34 91 123 45 67" />
            <Input label="Email" defaultValue="info@perfumetrading.com" />
            <Input label="Sitio Web" defaultValue="https://perfumetrading.com" className="col-span-2" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" icon={Save}>Guardar Cambios</Button>
          </div>
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection icon={Palette} title="Preferencias" description="Idioma, moneda y apariencia">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Idioma" options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }]} defaultValue="es" />
            <Select label="Moneda Base" options={[{ value: 'USD', label: 'USD (US Dollar)' }, { value: 'EUR', label: 'EUR (Euro)' }, { value: 'GBP', label: 'GBP (British Pound)' }]} defaultValue="USD" />
            <Select label="Zona Horaria" options={[{ value: 'CET', label: 'UTC+1 (CET)' }, { value: 'GMT', label: 'UTC+0 (GMT)' }, { value: 'EST', label: 'UTC-5 (EST)' }]} defaultValue="CET" />
            <Select label="Formato Fecha" options={[{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }]} defaultValue="DD/MM/YYYY" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" icon={Save}>Guardar Preferencias</Button>
          </div>
        </SettingsSection>

        {/* Roles */}
        <SettingsSection icon={Users} title="Roles de Usuario" description="Gestión de permisos Admin / Comercial / Viewer">
          <div className="space-y-3">
            {[
              { role: 'Administrador', desc: 'Acceso completo a todos los módulos', badge: 'success' as const, label: 'Activo' },
              { role: 'Comercial', desc: 'Acceso a catálogo, trading y socios', badge: 'success' as const, label: 'Activo' },
              { role: 'Consultor (Viewer)', desc: 'Solo lectura en todos los módulos', badge: 'warning' as const, label: 'Inactivo' },
            ].map((r) => (
              <div key={r.role} className="flex items-center justify-between p-3 bg-[#F3F2F1] dark:bg-[#2a2a2a] border border-[#EDEBE9] dark:border-[#333]">
                <div>
                  <p className="text-sm font-semibold text-[#323130] dark:text-[#e0e0e0]">{r.role}</p>
                  <p className="text-[11px] text-[#605E5C] dark:text-[#888]">{r.desc}</p>
                </div>
                <Badge variant={r.badge} dot>{r.label}</Badge>
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* Database */}
        <SettingsSection icon={Database} title="Conexión Base de Datos" description="Estado de la base de datos y configuración">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#F3F2F1] dark:bg-[#2a2a2a] border border-[#EDEBE9] dark:border-[#333]">
              <div className="flex items-center space-x-3">
                <Check size={20} className="text-green-600" />
                <div>
                  <p className="text-sm font-semibold">{dbStatus}</p>
                  <p className="text-[11px] text-[#605E5C] font-mono">{dbUrl}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">Probar Conexión</Button>
            </div>
            <div className="text-xs text-[#605E5C] dark:text-[#888] space-y-1">
              <p><strong>Configuración necesaria en .env:</strong></p>
              <code className="block bg-[#F3F2F1] dark:bg-[#2a2a2a] p-2 mt-1 font-mono text-[11px]">
                DATABASE_URL="file:./erp.db"
              </code>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
