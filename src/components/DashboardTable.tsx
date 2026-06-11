/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AttendanceRecord } from '../types';
import { Search, Info, Clock, Mail, Phone, CalendarRange, Copy, Check } from 'lucide-react';

interface DashboardTableProps {
  records: AttendanceRecord[];
  selectedDate: string;
  selectedCancha: string;
}

// Lista estándar de bloques de horario diario
const STANDARD_BLOCKS = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00'
];

/**
 * Convierte un bloque "HH:MM - HH:MM" en minutos de inicio para ordenar cronológicamente
 */
function getBlockStartTimeValue(blockStr: string): number {
  if (!blockStr) return 9999;
  const match = blockStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
  }
  return 9999;
}

interface AttendeeContactInfoProps {
  telefono?: string;
  correo?: string;
}

const AttendeeContactInfo: React.FC<AttendeeContactInfoProps> = ({ telefono, correo }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!correo) return;
    try {
      await navigator.clipboard.writeText(correo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const hasPhone = telefono && telefono !== 'Sin Teléfono' && telefono.trim().length > 0;
  const hasEmail = correo && correo !== 'Sin Correo' && correo !== 'anonymous' && correo.trim().length > 0;

  if (!hasPhone && !hasEmail) {
    return <span className="italic text-gray-300 text-[11px] font-sans">Sin datos de contacto</span>;
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto min-w-0">
      {hasPhone && (
        <a
          href={`tel:${telefono}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-2xs font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg transition-all border border-pink-100 shrink-0 font-mono"
          title="Llamar teléfono"
        >
          <Phone className="w-3 h-3 text-pink-500 shrink-0" />
          <span>{telefono}</span>
        </a>
      )}
      
      {hasEmail && (
        <div className="flex items-center gap-1.5 w-full sm:w-auto min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 px-3 py-1 text-2xs font-bold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 grow sm:grow-0">
            <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="truncate max-w-[170px] sm:max-w-[210px] md:max-w-[280px] font-mono select-all text-slate-650" title={correo}>
              {correo}
            </span>
          </div>
          
          <button
            onClick={handleCopyEmail}
            type="button"
            className={`p-1.5 rounded-lg border text-3xs font-extrabold transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer h-7 ${
              copied 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-white hover:bg-slate-50 border-gray-200 text-slate-500 hover:text-slate-850'
            }`}
            title={copied ? "Copiado con éxito" : "Copiar correo electrónico"}
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-sans pr-0.5">Copiado</span>
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export const DashboardTable: React.FC<DashboardTableProps> = ({
  records,
  selectedDate,
  selectedCancha,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filtrar registros de la fecha y cancha actuales de forma limpia (para ver su ocupación base)
  const baseRecords = records.filter(
    (r) => r.fecha === selectedDate && r.cancha === selectedCancha
  );

  // 2. Reunir todos los bloques (estándar + cualquier bloque extra que venga del Google Sheet)
  const uniqueBlocksSet = new Set([...STANDARD_BLOCKS]);
  baseRecords.forEach((r) => {
    if (r.hora && r.hora.trim()) {
      uniqueBlocksSet.add(r.hora.trim());
    }
  });

  // 3. Ordenar cronológicamente
  const sortedBlocks = Array.from(uniqueBlocksSet).sort((a, b) => {
    return getBlockStartTimeValue(a) - getBlockStartTimeValue(b);
  });

  // 4. Agrupación por bloque de hora e integración con el buscador de asistentes
  const isSearching = searchTerm.trim().length > 0;
  const searchLower = searchTerm.toLowerCase();

  const recordsByBlock: { [block: string]: AttendanceRecord[] } = {};
  sortedBlocks.forEach((block) => {
    recordsByBlock[block] = baseRecords.filter((r) => {
      const matchesBlock = r.hora && r.hora.trim() === block;
      if (!matchesBlock) return false;

      // Si hay buscador, filtramos los datos de esta reserva para ver si coincide
      if (isSearching) {
        return (
          r.nombre.toLowerCase().includes(searchLower) ||
          r.rut.toLowerCase().includes(searchLower) ||
          (r.rol && r.rol.toLowerCase().includes(searchLower)) ||
          (r.categoria && r.categoria.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  });

  // 5. Determinar cuáles bloques mostrar:
  // Si está buscando, solo mostramos bloques que contengan al menos un asistente que coincida
  // Si no está buscando, mostramos todos los bloques (los que tienen reservas y los vacíos/disponibles)
  const blocksToRender = sortedBlocks.filter((block) => {
    if (isSearching) {
      return (recordsByBlock[block] || []).length > 0;
    }
    return true;
  });

  const occupiedCount = baseRecords.length;
  const totalSlotsCount = sortedBlocks.length;
  const emptyBlocksCount = sortedBlocks.filter(b => (recordsByBlock[b] || []).length === 0).length;

  return (
    <div id="attendance-timeline-container" className="space-y-6">
      
      {/* Cabecera del Listado y buscador */}
      <div id="table-controls" className="p-6 bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 id="table-subtitle" className="text-base font-bold text-gray-800 flex items-center gap-2">
            Horarios y Asistentes
            <span id="rows-badge" className="px-2.5 py-0.5 text-2xs font-extrabold bg-emerald-50 text-emerald-700 rounded-full">
              {occupiedCount} {occupiedCount === 1 ? 'reserva activa' : 'reservas activas'}
            </span>
          </h2>
          <p className="text-2xs text-gray-400 font-medium mt-0.5">
            Vista agrupada cronológicamente para la {selectedCancha} en el día {selectedDate}
          </p>
        </div>

        {/* Buscador interactivo */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="search-input"
            type="text"
            placeholder="Buscar por Nombre, RUT o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full sm:w-64 text-sm bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all text-gray-700 placeholder-gray-400 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              Borrar
            </button>
          )}
        </div>
      </div>

      {/* Indicadores resumidos del día sobre ocupación */}
      {!isSearching && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <p className="text-3xs font-extrabold text-gray-400 uppercase tracking-widest">Total Horarios</p>
            <p className="text-base font-black text-slate-800 mt-1">{totalSlotsCount} bloques</p>
          </div>
          <div className="bg-amber-50/55 p-4 rounded-2xl border border-amber-100 text-slate-850">
            <p className="text-3xs font-extrabold text-amber-800/80 uppercase tracking-widest">Bloques Ocupados</p>
            <p className="text-base font-black text-amber-950 mt-1">{totalSlotsCount - emptyBlocksCount} ocupados</p>
          </div>
          <div className="bg-emerald-50/55 p-4 rounded-2xl border border-emerald-100 text-slate-850">
            <p className="text-3xs font-extrabold text-emerald-800/80 uppercase tracking-widest">Bloques Disponibles</p>
            <p className="text-base font-black text-emerald-950 mt-1">{emptyBlocksCount} libres</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <p className="text-3xs font-extrabold text-gray-400 uppercase tracking-widest">Ocupación</p>
            <p className="text-base font-black text-slate-800 mt-1">
              {totalSlotsCount > 0 ? Math.round(((totalSlotsCount - emptyBlocksCount) / totalSlotsCount) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Listado Chronológico de Bloques */}
      <div id="timeline-list" className="space-y-4">
        {blocksToRender.length === 0 ? (
          <div id="empty-state" className="flex flex-col items-center justify-center bg-white py-14 px-6 text-center rounded-2xl border border-gray-100">
            <div className="p-3 bg-gray-50 rounded-full text-gray-400 mb-2">
              <CalendarRange className="w-8 h-8" />
            </div>
            <h3 className="text-slate-700 font-bold text-sm">No se encontraron resultados</h3>
            <p className="text-gray-400 text-xs max-w-xs mt-1">
              Ningún registro coincide con el término de búsqueda actual en esta cancha y fecha.
            </p>
          </div>
        ) : (
          blocksToRender.map((block) => {
            const bookingsInBlock = recordsByBlock[block] || [];
            const isBlockEmpty = bookingsInBlock.length === 0;

            return (
              <div 
                key={block} 
                id={`block-${block.replace(/[^a-zA-Z0-9]/g, '')}`}
                className={`p-5 rounded-2xl border transition-all duration-150 flex flex-col md:flex-row md:items-start gap-4 ${
                  isBlockEmpty 
                    ? 'bg-emerald-50/10 border-emerald-100 hover:bg-emerald-50/20' 
                    : 'bg-white border-gray-200/70 hover:border-gray-300'
                }`}
              >
                {/* Indicador de Hora y Estado */}
                <div className="md:w-52 shrink-0 flex items-center md:flex-col md:items-start md:justify-center border-b md:border-b-0 md:border-r border-dashed border-gray-150 pb-3 md:pb-0 md:pr-4">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-bold font-mono tracking-tight">{block}</span>
                  </div>
                  
                  <div className="ml-auto md:ml-0 md:mt-2">
                    {isBlockEmpty ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-3xs font-extrabold text-emerald-700 bg-emerald-50 rounded-sm border border-emerald-100/60 font-sans">
                        🟢 SIN RESERVAS / LIBRE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-3xs font-extrabold text-amber-800 bg-amber-50 rounded-sm border border-amber-100 font-sans">
                        🔴 RESERVADO ({bookingsInBlock.length})
                      </span>
                    )}
                  </div>
                </div>

                {/* Listado de personas registradas en este bloque */}
                <div className="flex-1 min-w-0">
                  {isBlockEmpty ? (
                    <div className="py-2">
                      <p className="text-xs font-bold text-emerald-800">Cancha libre</p>
                      <p className="text-2xs text-gray-400 mt-0.5">
                        Este espacio horario está disponible para agendar actividades, clases o recreo.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 space-y-4 divide-dashed">
                      {bookingsInBlock.map((booking, idx) => (
                        <div 
                          key={booking.id} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${idx > 0 ? 'pt-4' : ''}`}
                        >
                          <div className="min-w-0 flex-1">
                            {/* Nombre y categoría */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-800 leading-tight">
                                {booking.nombre}
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-slate-100 text-4xs font-bold text-slate-550 uppercase tracking-wider font-mono">
                                {booking.rol || 'No especificado'}
                              </span>
                            </div>

                            {/* RUT / Categoría */}
                            <p className="text-3xs font-mono font-bold text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                              <span>RUT:</span>
                              <span className="bg-slate-50 border border-slate-150 text-slate-600 px-1.5 py-0.5 rounded-md uppercase">
                                {booking.rut || 'No registra'}
                              </span>
                              <span className="bg-emerald-50 text-emerald-850/80 border border-emerald-100/50 px-1.5 py-0.5 rounded-lg text-3xs font-extrabold">
                                {booking.categoria || 'Invitado/Socio'}
                              </span>
                            </p>
                          </div>

                          {/* Contacto directo del asistente */}
                          <div className="shrink-0 flex items-center w-full sm:w-auto mt-2 sm:mt-0">
                            <AttendeeContactInfo telefono={booking.telefono} correo={booking.correo} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
