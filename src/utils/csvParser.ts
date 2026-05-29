/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttendanceRecord } from '../types';

/**
 * Función robusta para parsear una línea de CSV respetando las comillas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parsea el CSV entregado por Google Sheets y lo tipa como AttendanceRecord
 */
export function parseCSVData(csvText: string): AttendanceRecord[] {
  if (!csvText) return [];

  // Dividir por saltos de línea (manejando \r\n de Windows u otros sistemas)
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // La primera línea contiene los encabezados
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());

  // Mapeamos los índices de las columnas según su nombre para que sea resiliente a cambios de posición
  const colIndices = {
    id: headers.findIndex(h => h === 'id'),
    nombre: headers.findIndex(h => h === 'nombre' || h === 'nombre completo (nombres y apellidos)'),
    rut: headers.findIndex(h => h === 'rut'),
    hora: headers.findIndex(h => h === 'bloque reservado' || h === 'bloque_reservado'),
    fecha: headers.findIndex(h => h === 'fecha de la reserva' || h === 'fecha_reserva' || h === 'fecha de reserva'),
    cancha: headers.findIndex(h => h === 'instalación reservada' || h === 'instalacion reservada' || h === 'cancha'),
    rol: headers.findIndex(h => h === 'rol'),
    telefono: headers.findIndex(h => h === 'teléfono' || h === 'telefono'),
    correo: headers.findIndex(h => h === 'correo electrónico1' || h === 'correo' || h === 'email'),
    categoria: headers.findIndex(h => h === 'usted califica como' || h === 'categoria' || h === 'calificacion'),
  };

  const records: AttendanceRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 3) continue; // Descartar líneas vacías o mal formadas

    const getValue = (idx: number, fallback: string = ''): string => {
      if (idx === -1 || idx >= values.length) return fallback;
      // Remover comillas si existen al inicio/final
      let val = values[idx];
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      return val.trim() || fallback;
    };

    // Extraer valores normalizados
    const id = getValue(colIndices.id, `sheet_${i}`);
    
    // Prioridad para el Nombre Completo
    let nombre = getValue(colIndices.nombre, 'Sin Nombre');
    
    const rut = getValue(colIndices.rut, 'Sin RUT');
    const hora = getValue(colIndices.hora, 'Por definir');
    const fechaRaw = getValue(colIndices.fecha, '');
    const canchaRaw = getValue(colIndices.cancha, 'Cancha 1');
    const rol = getValue(colIndices.rol, 'Invitado');
    const telefono = getValue(colIndices.telefono, 'Sin Teléfono');
    const correo = getValue(colIndices.correo, 'Sin Correo');
    const categoria = getValue(colIndices.categoria, 'Otros');

    // Normalizar fecha (por si viene en formato YYYY-MM-DD o DD-MM-YYYY o M/D/YYYY)
    let fecha = fechaRaw;
    if (fechaRaw) {
      // Si la fecha contiene '/'
      if (fechaRaw.includes('/')) {
        const parts = fechaRaw.split('/');
        if (parts.length === 3) {
          // Si es M/D/YYYY o MM/DD/YYYY
          if (parts[2].length === 4) {
            const month = parts[0].padStart(2, '0');
            const day = parts[1].padStart(2, '0');
            const year = parts[2];
            fecha = `${year}-${month}-${day}`;
          } else if (parts[0].length === 4) {
            // Si es YYYY/MM/DD
            const year = parts[0];
            const month = parts[1].padStart(2, '0');
            const day = parts[2].padStart(2, '0');
            fecha = `${year}-${month}-${day}`;
          }
        }
      }
    } else {
      // Fallback a hoy si no hay fecha especificada
      const d = new Date();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      fecha = `${d.getFullYear()}-${month}-${day}`;
    }

    // Normalizar Cancha
    let cancha = 'Cancha 1';
    const cLow = canchaRaw.toLowerCase();
    if (cLow.includes('cancha 2') || cLow === '2' || cLow === 'c2') {
      cancha = 'Cancha 2';
    } else if (cLow.includes('multi') || cLow.includes('cancha 3') || cLow === '3') {
      cancha = 'Multicancha';
    } else if (cLow.includes('cancha 1') || cLow === '1' || cLow === 'c1') {
      cancha = 'Cancha 1';
    } else {
      // Si dice otra cosa, lo dejamos tal como viene o fallback a la columna limpia
      cancha = canchaRaw;
    }

    records.push({
      id,
      fecha,
      cancha,
      hora,
      nombre,
      rut,
      rol,
      telefono,
      correo,
      categoria
    });
  }

  return records;
}
