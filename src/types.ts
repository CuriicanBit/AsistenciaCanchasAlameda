/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AttendanceRecord {
  id: string;
  fecha: string; // Formato YYYY-MM-DD
  cancha: 'Cancha 1' | 'Cancha 2' | 'Multicancha' | string;
  hora: string; // Bloque reservado, ej: "12:00 - 13:00"
  nombre: string; // Nombre completo
  rut: string; // RUT del asistente
  rol: string; // Organizador, Invitado, etc.
  telefono: string; // Teléfono de contacto
  correo: string; // Email
  categoria: string; // Funcionario, Familiar de Funcionario, etc.
}
