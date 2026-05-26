import RoomEventManagementService from '@services/room-event-management.service.js';
import { ValidationError } from '@errors';

export class RoomEventsService {
    // Lista eventos con filtro por cinemaId (opcional).
    async findAllEvents(filters?: any) {
        return RoomEventManagementService.findAllEvents(filters);
    }

    // Obtiene un evento por ID.
    async findEventById(id: number) {
        return RoomEventManagementService.findEventById(id);
    }

    // Crea un evento alternativo. Si se recibe cinemaId (contexto implícito), se valida que no sea undefined.
    async createEvent(body: any, sessionCinemaId?: number) {
        const cinemaId = sessionCinemaId ?? body.cinema;
        if (cinemaId === undefined) {
            throw new ValidationError(
                'No se puede determinar la sucursal. Especificá "cinema" en el cuerpo de la petición o iniciá sesión con una sucursal asignada.',
            );
        }
        return RoomEventManagementService.createEvent(body);
    }

    // Actualiza un evento parcialmente.
    async updateEvent(id: number, body: any) {
        return RoomEventManagementService.updateEvent(id, body);
    }

    // Cancela un evento (borrado lógico del evento y su booking).
    async deleteEvent(id: number) {
        return RoomEventManagementService.deleteEvent(id);
    }
}

export default new RoomEventsService();
