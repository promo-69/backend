import { Database, Ops } from '@database/index.js';
import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.util.js';
import type { Transaction } from 'sequelize';

export class MovieLifecycleService {
	private get _movies() {
		return Database.repository('main', 'movies') as any;
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

	private async _getActiveShowtimesCount(movieId: number, now: Date): Promise<number> {
		const showtimeRows = await this._showtimes.getAll(
			{ count: false, attributes: ['booking'] },
			{ movie: movieId, deleted_at: null },
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

	private async _transitionMovieState(
		movie: any,
		targetState: number,
		transaction?: Transaction,
		extraData?: Record<string, any>,
	): Promise<boolean> {
		if (!movie || movie.lifecycle_state === targetState) return false;

		await this._movies.update(
			movie.id,
			{
				lifecycle_state: targetState,
				lifecycle_state_changed_at: new Date(),
				...(extraData || {}),
			},
			{ transaction },
		);

		Logger.info(`[movie-lifecycle] Película "${movie.title}" pasó de ${movie.lifecycle_state} a ${targetState}`);
		return true;
	}

	async syncMovieLifecycle(movieId: number, transaction?: Transaction): Promise<boolean> {
		const movie = await this._movies.getById(movieId, {
			attributes: ['id', 'title', 'release_date', 'lifecycle_state', 'lifecycle_state_changed_at'],
			transaction,
		});

		if (!movie) return false;

		return this.evaluateMovieLifecycle(movie, transaction);
	}

	async syncMoviesLifecycle(): Promise<number> {
		const movies = await this._movies.getAll(
			{
				count: false,
				attributes: ['id', 'title', 'release_date', 'lifecycle_state', 'lifecycle_state_changed_at'],
				order: [['id', 'ASC']],
			},
			{
				deleted_at: null,
				lifecycle_state: { [Ops.in]: [1, 2, 3, 4] },
			},
		);

		const movieList = Array.isArray(movies) ? movies : movies.rows || [];
		let updated = 0;

		for (const movie of movieList) {
			const changed = await this.evaluateMovieLifecycle(movie);
			if (changed) updated += 1;
		}

		return updated;
	}

	async scheduleMovieLastDays(movieId: number, daysUntilOut: number, transaction?: Transaction): Promise<any> {
		const movie = await this._movies.getById(movieId, {
			attributes: ['id', 'title', 'lifecycle_state', 'lifecycle_state_changed_at'],
			transaction,
		});
		if (!movie) throw new Error('Película no encontrada');

		if (movie.lifecycle_state !== 3 && movie.lifecycle_state !== 4) {
			throw new Error('La película debe estar en estado 3 o 4 para programar la salida de cartelera');
		}

		const transitionAt = new Date();
		transitionAt.setDate(transitionAt.getDate() + Math.max(1, Number(daysUntilOut || 7)));

		await this._movies.update(
			movieId,
			{
				lifecycle_state: 4,
				lifecycle_state_changed_at: new Date(),
				lifecycle_state_next_change_at: transitionAt,
			},
			{ transaction },
		);

		return {
			id: movie.id,
			title: movie.title,
			lifecycle_state: 4,
			lifecycle_state_next_change_at: transitionAt,
		};
	}

	async evaluateMovieLifecycle(movie: any, transaction?: Transaction): Promise<boolean> {
		if (!movie) return false;

		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const releaseDate = movie.release_date ? new Date(movie.release_date) : null;
		const releaseDateStart = releaseDate
			? new Date(releaseDate.getFullYear(), releaseDate.getMonth(), releaseDate.getDate())
			: null;

		if (movie.lifecycle_state === 1 && releaseDateStart && releaseDateStart <= todayStart) {
			return this._transitionMovieState(movie, 2, transaction);
		}

		if (movie.lifecycle_state === 2) {
			const changedAt = movie.lifecycle_state_changed_at ? new Date(movie.lifecycle_state_changed_at) : null;
			if (changedAt && now.getTime() - changedAt.getTime() >= 7 * 24 * 60 * 60 * 1000) {
				return this._transitionMovieState(movie, 3, transaction);
			}
		}

		if (movie.lifecycle_state === 3) {
			const activeShowtimes = await this._getActiveShowtimesCount(movie.id, now);
			const { weekday, hour, minute } = this.getTodayParts(this._lifecycleConfig.timezone);
			const shouldEnterLastDays =
				activeShowtimes === 0 &&
				weekday === this._lifecycleConfig.lastDaysWeekday &&
				hour === this._lifecycleConfig.lastDaysHour &&
				minute >= 0;

			if (shouldEnterLastDays) {
				return this._transitionMovieState(movie, 4, transaction);
			}
		}

		if (movie.lifecycle_state === 4) {
			const nextChangeAt = movie.lifecycle_state_next_change_at
				? new Date(movie.lifecycle_state_next_change_at)
				: null;
			if (nextChangeAt && now.getTime() >= nextChangeAt.getTime()) {
				return this._transitionMovieState(movie, 5, transaction);
			}
		}

		return false;
	}
}

export default new MovieLifecycleService();
