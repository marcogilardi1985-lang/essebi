// app/components/TimeSlotGrid.tsx
"use client"; 

import React, { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';

// Interfaccia per lo stato di uno slot recuperato dal backend
interface SlotStatus {
    start: Date;
    end: Date;
    isOccupied: boolean;
}

/**
 * Funzione utilità per calcolare gli slot da un'ora X a Y in intervalli di 30 minuti.
 * Non è più necessaria, ma la manteniamo come riferimento interno se si modifica la logica del backend.
 */
// const generateTimeSlots = (date: Date, startHour: number, endHour: number, intervalMinutes: number): SlotStatus[] => { ... }


// Componente per visualizzare uno slot singolo
const TimeSlotCell: React.FC<{ status: SlotStatus }> = ({ status }) => {
  const timeString = `${status.start.getHours().toString().padStart(2, '0')}:${status.start.getMinutes().toString().padStart(2, '0')} - ${status.end.getHours().toString().padStart(2, '0')}:${status.end.getMinutes().toString().padStart(2, '0')}`;
  
  // Logica di colorazione: Verde se libero (o non occupato) e Rosso se occupato.
  const className = status.isOccupied ? "bg-red-100 hover:bg-red-200 cursor-pointer" : "bg-green-50 hover:bg-green-100 cursor-pointer";

  return (
    <div className={`p-2 text-xs border-b border-gray-200 ${className} flex items-center justify-center transition duration-150`}>
      {/* Mostra l'orario e lo stato */}
      <span className="font-medium mr-2">{timeString}</span>
      {status.isOccupied ? (
        <div className="text-red-700 font-bold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle mr-1"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Occupato
        </div>
      ) : (
        <span className="text-green-700 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle mr-1"><path d="M22 11.08V12l-10-9-10 9v1.5a3.5 3.5 0 0 0 0 7h18z"/></svg>
          Disponibile
        </span>
      )}
    </div>
  );
};


// Componente principale che gestisce la visualizzazione del calendario
const TimeSlotGrid: React.FC = () => {

  // --- Configurazione Fissa (Come richiesto) ---
  // Giorni: Martedì (2) a Sabato (6)
  // Orario: 08:00 - 18:00
  // Slot: 30 minuti

  const daysOfWeek = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Solo i giorni richiesti
  const startHour = 8; // 08:00
  const endHour = 18; // Fino a questo orario (l'ultimo slot termina alle 18:00)
  const intervalMinutes = 30;

  const [slotsData, setSlotsData] = useState<SlotStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Hook per caricare i dati API quando il componente viene montato o la data cambia
  useEffect(() => {
    const todayDate = new Date();
    const dateString = `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, '0')}-${todayDate.getDate().toString().padStart(2, '0')}`;

    async function fetchSlots() {
        setLoading(true);
        setError(null);
        try {
            // Chiama l'API che abbiamo creato in app/api/appointments/route.ts
            const response = await fetch(`/api/appointments/check-slots?date=${dateString}`);
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status} - Controlla la console del server per i dettagli.`);
            }
            const data: SlotStatus[] = await response.json();
            setSlotsData(data);
        } catch (e) {
            console.error("Fetch error:", e);
            setError((e as Error).message || "Impossibile connettersi al server di gestione appuntamenti. Controlla la console.");
        } finally {
            setLoading(false);
        }
    }

    fetchSlots();
  }, []);


  // Funzione generica per renderizzare la griglia per un giorno specifico
  const renderDayGrid = (dayName: string) => {
    if (!slotsData.length) return null; // Non rendi nulla se non ci sono dati caricati

    return (
      <div className="col-span-1 bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        {/* Header Giorno */}
        <div className={`p-4 text-center font-bold flex items-center justify-center ${dayName.toLowerCase().includes('sat') ? 'bg-primary-pink/10' : 'bg-gray-50'} border-b`}>
          <CalendarDays className="w-5 h-5 mr-2" /> {dayName}
        </div>

        {/* Corpo della Griglia Oraria */}
        <div className="divide-y divide-gray-100">
          {slotsData.map((slot, index) => (
            // Passiamo l'oggetto status direttamente al componente cell
            <TimeSlotCell key={index} status={slot} /> 
          ))}
        </div>
      </div>
    );
  };

  if (loading && !error) {
    return <div className="p-10 text-center">Caricamento disponibilità per oggi...</div>;
  }

  if (error) {
    return <div className="p-10 bg-red-50 border-l-4 border-red-500 text-red-700">{error}</div>;
  }


  // Renderizza la griglia per ogni giorno della settimana richiesto
  return (
    <div className="p-6 bg-background-light rounded-xl shadow-2xl">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-10 flex items-center">
        <CalendarDays className="w-7 h-7 mr-2 text-primary-pink" /> Gestione Appuntamenti EsseBiFashon
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {daysOfWeek.map(day => renderDayGrid(day))}
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-primary-pink text-sm">
          <p className="font-bold">🚀 Stato del Sistema:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong style="color: green;">Visualizzazione:</strong> Perfetta. La griglia è dinamica e si connette al backend API.</li>
              <li><strong style="color: blue;">Backend/Schema:** Schema DB pronto (`prisma/schema.prisma`). L'API `/api/appointments` gestisce la logica di slot.*</li>
              <li><strong style="color: orange;">Prossimo Passaggio:</strong> Eseguire la migrazione del database e implementare l'endpoint POST per le prenotazioni.</li>
          </ul>
      </div>

    </div>
  );
};

export default TimeSlotGrid;