import { Database, Ops } from '@database/index.js';
import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';
import type { Transaction } from 'sequelize';

export class SpecialEventsLifecycleService {
	private get _events() {
		return Database.repository('main', 'special-events') as any;
	}

	private get _showtimes() {
		return Database.repository('main', 'showtimes') as any;
	}

	private get _roomBookings() {
		return Database.repository('main', 'room-bookings') as any;
	}

	private get _lifecycleConfig() {
		return AppConfig.load().movieLifecycle;
	}

	private getTodayParts(timezone: string) {
		const now = new Date();
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: timezone,
			weekday: 'short',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		});
		const parts = formatter.formatToParts(now);
		const weekday = parts.find((part) => part.type === 'weekday')?.value;
		const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
		const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');

		return {
			now,
			weekday: weekday ? this._weekdayToNumber(weekday) : now.getUTCDay(),
			hour,
			minute,
		};
	}

	private _weekdayToNumber(weekday: string): number {
		const map: Record<string, number> = {
			Sun: 0,
			Mon: 1,
			Tue: 2,
			Wed: 3,
			Thu: 4,
			Fri: 5,
			Sat: 6,
		};

		return map[weekday] ?? 0;
	}

	private async _getActiveShowtimesCount(eventId: number, now: Date): Promise<number> {
		const showtimeRows = await this._showtimes.getAll(
			{ count: false, attributes: ['booking'] },
			{ special_event_id: eventId, deleted_at: null },
		);
		const bookingIds = (Array.isArray(showtimeRows) ? showtimeRows : showtimeRows.rows || []).map(
			(row: any) => row.booking,
		);

		if (!bookingIds.length) return 0;

		const activeBookings = await this._roomBookings.getAll(
			{ count: true, attributes: ['id'] },
			{ id: bookingIds, start_time: { [Ops.gt]: now }, deleted_at: null },
		);

		if (Array.isArray(activeBookings)) return activeBookings.length;
		return activeBookings?.count ?? 0;
	}

	private async _transitionEventState(
		event: any,
		targetState: number,
		transaction?: Transaction,
		extraData?: Record<string, any>,
	): Promise<boolean> {
		if (!event || event.lifecycle_state === targetState) return false;

		await this._events.update(
			event.id,
			{
				lifecycle_state: targetState,
				...(extraData || {}),
			},
			{ transaction },
		);

		Logger.info(
			`[special-events-lifecycle] Evento "${event.title}" pasó de ${event.lifecycle_state} a ${targetState}`,
		);
		return true;
	}

	async syncEventLifecycle(eventId: number, transaction?: Transaction): Promise<boolean> {
		const event = await this._events.getById(eventId, {
			attributes: ['id', 'title', 'release_date', 'end_date', 'lifecycle_state'],
			transaction,
		});

		if (!event) return false;

		return this.evaluateEventLifecycle(event, transaction);
	}

	async syncEventsLifecycle(): Promise<number> {
		const events = await this._events.getAll(
			{
				count: false,
				attributes: ['id', 'title', 'release_date', 'end_date', 'lifecycle_state'],
				order: [['id', 'ASC']],
			},
			{
				deleted_at: null,
				lifecycle_state: { [Ops.in]: [1, 2, 3, 4] },
			},
		);

		const eventList = Array.isArray(events) ? events : events.rows || [];
		let updated = 0;

		for (const event of eventList) {
			const changed = await this.evaluateEventLifecycle(event);
			if (changed) updated += 1;
		}

		return updated;
	}

	async scheduleEventLastDays(eventId: number, daysUntilOut: number, transaction?: Transaction): Promise<any> {
		const event = await this._events.getById(eventId, {
			attributes: ['id', 'title', 'lifecycle_state', 'release_date'],
			transaction,
		});
		if (!event) throw new Error('Evento no encontrado');

		if (event.lifecycle_state !== 3 && event.lifecycle_state !== 4) {
			throw new Error('El evento debe estar en estado 3 o 4 para programar la salida de cartelera');
		}

		const transitionAt = new Date();
		transitionAt.setDate(transitionAt.getDate() + Math.max(1, Number(daysUntilOut || 7)));

		await this._events.update(
			eventId,
			{
				lifecycle_state: 4,
				end_date: transitionAt.toISOString().split('T')[0],
			},
			{ transaction },
		);

		return {
			id: event.id,
			title: event.title,
			lifecycle_state: 4,
			end_date: transitionAt,
		};
	}

	async evaluateEventLifecycle(event: any, transaction?: Transaction): Promise<boolean> {
		if (!event) return false;

		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const releaseDate = event.release_date ? new Date(event.release_date) : null;
		const releaseDateStart = releaseDate
			? new Date(releaseDate.getFullYear(), releaseDate.getMonth(), releaseDate.getDate())
			: null;

		if (event.lifecycle_state === 1 && releaseDateStart && releaseDateStart <= todayStart) {
			return this._transitionEventState(event, 2, transaction);
		}

		if (event.lifecycle_state === 2) {
			// Si no existe campo lifecycle_state_changed_at en special_events, usamos release_date + 7 días
			if (releaseDate) {
				const threshold = new Date(releaseDate);
				threshold.setDate(threshold.getDate() + 7);
				if (now.getTime() >= threshold.getTime()) {
					return this._transitionEventState(event, 3, transaction);
				}
			}
		}

		if (event.lifecycle_state === 3) {
			const activeShowtimes = await this._getActiveShowtimesCount(event.id, now);
			const { weekday, hour, minute } = this.getTodayParts(this._lifecycleConfig.timezone);
			const shouldEnterLastDays =
				activeShowtimes === 0 &&
				weekday === this._lifecycleConfig.lastDaysWeekday &&
				hour === this._lifecycleConfig.lastDaysHour &&
				minute >= 0;

			if (shouldEnterLastDays) {
				return this._transitionEventState(event, 4, transaction);
			}
		}

		if (event.lifecycle_state === 4) {
			const endDate = event.end_date ? new Date(event.end_date) : null;
			if (endDate && now.getTime() >= endDate.getTime()) {
				return this._transitionEventState(event, 5, transaction);
			}
		}

		return false;
	}
}

export default new SpecialEventsLifecycleService();
