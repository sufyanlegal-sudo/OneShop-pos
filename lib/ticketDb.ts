import fs from 'fs';
import path from 'path';

export interface SupportTicket {
  id: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
}

const TICKETS_FILE = path.join(process.cwd(), 'data', 'support_tickets.json');

let memoryTickets: SupportTicket[] = [];
let hasLoaded = false;

function loadTickets(): SupportTicket[] {
  if (hasLoaded && memoryTickets.length > 0) return memoryTickets;
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const data = fs.readFileSync(TICKETS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        memoryTickets = parsed;
        hasLoaded = true;
        return memoryTickets;
      }
    }
  } catch (err) {
    console.warn('[TicketDb] Error reading tickets file:', err);
  }
  hasLoaded = true;
  return memoryTickets;
}

function persistTickets(tickets: SupportTicket[]) {
  try {
    const dir = path.dirname(TICKETS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), 'utf8');
  } catch (err) {
    console.warn('[TicketDb] Error saving tickets file:', err);
  }
}

export async function getAllTickets(): Promise<SupportTicket[]> {
  return loadTickets();
}

export async function saveTicket(ticket: SupportTicket): Promise<SupportTicket> {
  const tickets = loadTickets();
  tickets.unshift(ticket);
  memoryTickets = tickets;
  persistTickets(tickets);
  return ticket;
}
