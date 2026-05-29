/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Layers, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  Users2,
  Trophy,
  Activity,
  Heart
} from 'lucide-react';
import { AttendanceRecord } from './types';
import { parseCSVData } from './utils/csvParser';
import { DashboardTable } from './components/DashboardTable';
import { UniversidadLogo } from './components/UniversidadLogo';

const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqP1bOwgNI2AWmJY4_LPK--el-n5b0HAYEfm5_wJKK_xwSWTADuIe9wZECoDUi6GFGhTT1avjTBp72/pub?gid=0&single=true&output=csv";

export default function App() {
  // Estado para la base de datos de registros
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros interactivos
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Hoy en formato local de Chile u horario local habitual YYYY-MM-DD
    const d = new Date();
    // En el backend o entorno local, formatear como YYYY-MM-DD con seguridad zonal
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const [selectedCancha, setSelectedCancha] = useState<string>('Cancha 1');

  // Cargar datos del CSV automáticamente al abrir la página
  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Agregamos un timestamp aleatorio al fetch para evitar problemas de caché del navegador
      const response = await fetch(`${GOOGLE_SHEETS_CSV_URL}&t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Error en la descarga del archivo de datos (${response.status})`);
      }
      const rawText = await response.text();
      const parsedRecords = parseCSVData(rawText);
      setRecords(parsedRecords);
    } catch (err: any) {
      console.error(err);
      setError(
        "No se pudieron cargar las reservas de asistencia de forma automática. " +
        "Por favor, verifique el estado del servidor de reserva o reintente la conexión."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Obtener la lista de fechas únicas que contienen datos dentro del CSV para recomendárselas al usuario
  const availableDatesWithReservations = Array.from(
    new Set<string>(records.map((r) => r.fecha))
  ).sort();

  // Filtrado final de registros para cálculos estadísticos locales
  const currentFiltersRecords = records.filter(
    (r) => r.fecha === selectedDate && r.cancha === selectedCancha
  );

  // Formatear fecha para mostrar de un modo más amigable (inglés o español)
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return date.toLocaleDateString('es-CL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return dateStr;
  };

  return (
    <div id="app" className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white antialiased">
      
      {/* HEADER DE LA PÁGINA */}
      <header id="main-header" className="bg-white border-b border-gray-100 py-6 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-1 px-2 bg-slate-50 rounded-xl border border-gray-100 flex items-center justify-center h-16 w-16">
              <UniversidadLogo className="h-12 w-auto shrink-0" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Asistencia Deportiva
                <span className="text-3xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  En Vivo
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold">
                Departamento de Tecnologías y Comunicaciones — Sede Talca
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón sutil de recarga manual de datos */}
            <button
              onClick={fetchAttendanceData}
              disabled={loading}
              title="Volver a sincronizar los datos de asistencia"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar ahora
            </button>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">

        {/* MENSAJES DE CARGA / ERROR */}
        {loading && (
          <div id="loading-container" className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-xs mb-8 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-700">Conectando con el servidor de asistencia...</p>
            <p className="text-xs text-gray-400 mt-1">Sincronizando el listado detallado de reservas en tiempo real.</p>
          </div>
        )}

        {error && (
          <div id="error-container" className="p-5 bg-rose-50 border border-rose-100 rounded-3xl text-rose-800 flex items-start gap-3.5 mb-8">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Problema de Sincronización</h4>
              <p className="text-xs mt-1 text-rose-700">{error}</p>
              <button 
                onClick={fetchAttendanceData} 
                className="mt-2.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-2xs font-bold transition-all cursor-pointer"
              >
                Reintentar Conexión
              </button>
            </div>
          </div>
        )}

        {/* CUADROS RÁPIDOS INFORMATIVOS (SOLO SI HAY DATOS) */}
        {!loading && !error && records.length > 0 && (
          <div id="info-boxes" className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {/* Box 1: Total Reservas en el CSV */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center space-x-4">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                <Users2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xs font-extrabold text-gray-400 uppercase tracking-widest">Base de Datos</p>
                <p className="text-lg font-black text-slate-800">{records.length} reservas</p>
              </div>
            </div>

            {/* Box 2: Total para el Filtro Activo */}
            <div className="bg-emerald-50/40 p-5 rounded-3xl border border-emerald-100/55 flex items-center space-x-4">
              <div className="p-3 bg-emerald-100/60 text-emerald-700 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xs font-extrabold text-emerald-800/70 uppercase tracking-widest">Bloque Activo</p>
                <p className="text-lg font-black text-emerald-950">
                  {currentFiltersRecords.length} en {selectedCancha}
                </p>
              </div>
            </div>

            {/* Box 3: Total Canchas en sincronía */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xs font-extrabold text-gray-400 uppercase tracking-widest">Sincronización</p>
                <p className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                  Automática
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN INTERTACTIVA DE FILTROS (FECHAS Y CANCHAS) */}
        {!loading && !error && (
          <div id="filters-panel" className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-xs mb-8">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Filtros de Búsqueda
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* SELECTOR DE FECHAS */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  1. Seleccione la Fecha de Asistencia:
                </label>
                <input
                  id="date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  className="px-4 py-3 bg-slate-50 border border-gray-200 hover:border-gray-300 rounded-2xl text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all font-sans cursor-pointer text-base"
                />

                {/* ACCESO RÁPIDO A FECHAS CON RESERVAS */}
                {availableDatesWithReservations.length > 0 && (
                  <div className="mt-3.5">
                    <p className="text-3xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                      Fechas con reservas registradas:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableDatesWithReservations.map((dateVal) => {
                        // Formatear para que se vea súper bonito
                        const parts = dateVal.split('-');
                        const shortLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateVal;
                        const isSelected = selectedDate === dateVal;

                        return (
                          <button
                            key={dateVal}
                            type="button"
                            onClick={() => setSelectedDate(dateVal)}
                            className={`px-3 py-1 text-2xs font-extrabold rounded-lg transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            📅 {shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SELECTOR DE CANCHAS (PESTAÑAS) */}
              <div className="flex flex-col justify-between">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    2. Seleccione la Cancha o Recinto:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Cancha 1', 'Cancha 2', 'Multicancha'].map((cancha) => {
                      const isActive = selectedCancha === cancha;
                      return (
                        <button
                          key={cancha}
                          type="button"
                          onClick={() => setSelectedCancha(cancha)}
                          className={`py-3.5 px-2 text-center text-xs font-black rounded-2xl border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                              : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100/80 hover:text-slate-800'
                          }`}
                        >
                          {cancha}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 bg-emerald-50/40 border border-emerald-100/50 p-3 rounded-2xl">
                  <p className="text-3xs text-emerald-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    El sistema filtra automáticamente. No se requiere recargar de forma manual.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* FEEDBACK DE FECHA SELECCIONADA */}
        {!loading && !error && (
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Visualización: {formatFriendlyDate(selectedDate)}
            </h4>
          </div>
        )}

        {/* TABLA DE ASISTENTES */}
        {!loading && !error && (
          <DashboardTable 
            records={records}
            selectedDate={selectedDate}
            selectedCancha={selectedCancha}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer id="main-footer" className="bg-white border-t border-gray-100 py-10 mt-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <UniversidadLogo className="h-10 w-auto shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">
                Universidad Autónoma de Chile
              </p>
              <p className="text-3xs text-slate-500 font-semibold">
                Departamento de Tecnologías y Comunicaciones — Sede Talca
              </p>
            </div>
          </div>
          <div className="text-center md:text-right font-sans text-xs text-slate-400">
            <p className="font-semibold text-slate-705">
              Control de Asistencia Deportiva
            </p>
            <p className="mt-1 font-mono text-4xs text-gray-305">
              © {new Date().getFullYear()} UA Talca — Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
