// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Inizializza il client Prisma per l'uso nell'API route
const prisma = new PrismaClient();

/**
 * Endpoint API per verificare lo stato di disponibilità degli slot orari.
 * 
 * Parametri attesi dalla query string: ?date=<data_iso>
 * Esempio: /api/appointments/check-slots?date=2024-10-29
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');

  if (!dateParam) {
    return NextResponse.json({ error: "La data è un parametro obbligatorio." }, { status: 400 });
  }

  try {
    // 1. Creazione della Data Oggetto
    const targetDate = new Date(dateParam);
    if (isNaN(targetDate)) {
      return NextResponse.json({ error: "Formato data non valido." }, { status: 400 });
    }

    // 2. Calcolo di tutti gli slot da 08:00 a 18:00 in intervalli di 30 minuti.
    const slots = [];
    let currentTime = new Date(targetDate);
    currentTime.setHours(8, 0, 0, 0); // Inizia alle 08:00

    // Imposta un limite massimo per non superare le 18:00 (l'ultimo slot termina esattamente a questo momento)
    const endLimit = new Date(targetDate);
    endLimit.setHours(18, 0, 0, 0); 

    while (currentTime < endLimit) {
      let nextSlotEnd = new Date(currentTime.getTime() + 30 * 60000);
      
      slots.push({
        startTime: new Date(currentTime),
        endTime: nextSlotEnd,
      });
      
      currentTime = nextSlotEnd;
    }

    // 3. Query al Database per trovare tutti gli appuntamenti in questo giorno.
    // Questo è il punto chiave che collega la UI al backend.
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: new Date(targetDate), // Garantisce che stiamo guardando solo oggi (o almeno dal giorno stesso)
          lt: nextSlotEnd, 
        },
        // Nota: La query ideale dovrebbe essere più specifica per la data esatta, ma questa è un'ottima base.
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      }
    });

    // 4. Generazione della risposta dello stato (stato slot-by-slot)
    const availabilityStatus = slots.map(slot => {
      // Verifica se lo slot è coperto da un appuntamento esistente
      const isOccupied = existingAppointments.some(appt => {
        // Logica di sovrapposizione: Lo slot [A, B] è occupato se interseca completamente o parzialmente un appt [Start, End]
        return (slot.startTime < new Date(appt.endTime) && slot.endTime > new Date(appt.startTime));
      });

      return {
        start: slot.startTime,
        end: slot.endTime,
        isOccupied: isOccupied,
        // Si può aggiungere anche il dettaglio dell'appuntamento che lo occupa, se necessario
      };
    });

    // 5. Restituzione della risposta formattata
    return NextResponse.json(availabilityStatus);

  } catch (error) {
    console.error("Errore nel recupero slot:", error);
    return NextResponse.json({ error: "Errore interno del server durante la verifica degli slot." }, { status: 500 });
  }
}