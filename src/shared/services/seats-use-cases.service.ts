import SeatsService from '@modules/seats/_.service.js';

export const SeatUseCases = {
    create: SeatsService.createSeats.bind(SeatsService),
};
