// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Endpoint API per verificare lo stato di disponibilità degli slot orari.
 * Parametri attesi dalla query string: ?date=<data_iso>
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
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: new Date(targetDate),
          lt: nextSlotEnd, 
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      }
    });

    // 4. Generazione della risposta dello stato (stato slot-by-slot)
    const availabilityStatus = slots.map(slot => {
      // Logica di sovrapposizione: Lo slot [A, B] è occupato se interseca completamente o parzialmente un appt [Start, End]
      const isOccupied = existingAppointments.some(appt => {
        return (slot.startTime < new Date(appt.endTime) && slot.endTime > new Date(appt.startTime));
      });

      return {
        start: slot.startTime,
        end: slot.endTime,
        isOccupied: isOccupied,
      };
    });

    // 5. Restituzione della risposta formattata
    return NextResponse.json(availabilityStatus);

  } catch (error) {
    console.error("Errore nel recupero slot:", error);
    return NextResponse.json({ error: "Errore interno del server durante la verifica degli slot." }, { status: 500 });
  }
}


/**
 * POST /api/appointments: Prenota uno slot orario specifico.
 */
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { date, startTime, endTime } = body;

    if (!date || !startTime || !endTime) {
        return NextResponse.json({ error: "Tutti i campi (data, orario di inizio, orario di fine) sono obbligatori." }, { status: 400 });
    }

    try {
        // 1. Creazione delle date esatte per Prisma
        const startDateTime = new Date(`${date}T${startTime}:00`);
        const endDateTime = new Date(`${date}T${endTime}:00`);

        if (isNaN(startDateTime) || isNaN(endDateTime)) {
             return NextResponse.json({ error: "Gli orari forniti non sono validi per la data specificata." }, { status: 400 });
        }

        // Simula l'utente che prenota e lo staff assegnato (QUESTA PARTE DEVE ESSERE MIGLIORATA CON AUTHENTICATION)
        const dummyUserId = "user-temp-id"; 
        const dummyStaffId = "staff-temp-id"; 


        const newAppointment = await prisma.appointment.create({
            data: {
                startTime: startDateTime,
                endTime: endDateTime,
                serviceId: "placeholder_service", 
                userId: dummyUserId, 
                staffId: dummyStaffId,
                status: "CONFIRMED"
            }
        });

        return NextResponse.json({ message: "Appuntamento prenotato con successo!", appointment: newAppointment }, { status: 201 });

    } catch (error) {
        console.error("Errore nel processo di prenotazione:", error);
        // Cattura errori specifici del DB (es. slot già occupato)
        if ((error as any).code === 'P2012') { 
            return NextResponse.json({ error: "Questo slot non è più disponibile o c'è un conflitto di prenotazione." }, { status: 409 });
        }
        // Fallback generale per tutti gli altri errori del sistema.
        return NextResponse.json({ error: `Errore interno del server durante la prenotazione: ${(error as Error).message}` }, { status: 500 });
    }
<|"|>,path:<|"|>app/api/appointments/route.ts<|"|>}<tool_call|>
