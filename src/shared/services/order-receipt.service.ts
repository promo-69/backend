import { Database } from '@database/index.js';
import { QueueProvider } from '@providers/queue.provider.js';
import { JWTUtil } from '@utils/jwt.util.js';
import { AppConfig } from '@config/app.config.js';
import { LINE_TYPE } from '@constants/magic-vars.constant.js';

class OrderReceiptService {
	private get _orders() {
		return Database.repository('main', 'orders') as any;
	}
	private get _orderLines() {
		return Database.repository('main', 'order-lines') as any;
	}
	private get _customers() {
		return Database.repository('main', 'customers') as any;
	}

	generateOrderQr(order: any, tickets: any[] = [], concessions: any[] = []): string {
		const secret = AppConfig.load().security.jwtCommonSecret;
		const hasTickets = tickets && tickets.length > 0;
		const hasConcessions = concessions && concessions.length > 0;
		let t_exp: number | null = null;
		let c_exp: number | null = null;
		let expiresInSeconds = 86400;

		if (hasTickets) {
			const ticketData = tickets[0];
			const endTime = ticketData?._RoomBookings?.end_time || new Date(Date.now() + 7200000);
			t_exp = Math.floor(new Date(endTime).getTime() / 1000);
			expiresInSeconds = Math.max(t_exp - Math.floor(Date.now() / 1000), 0);
		}
		if (hasConcessions) {
			const endOfDay = new Date();
			endOfDay.setHours(23, 59, 59, 999);
			c_exp = Math.floor(endOfDay.getTime() / 1000);
			expiresInSeconds = Math.max(expiresInSeconds, Math.max(c_exp - Math.floor(Date.now() / 1000), 0));
		}

		const cinemaName = (order as any)._Cinemas?.name || 'Cine Central';
		let bkg: any = undefined;
		if (hasTickets) {
			const roomBooking = tickets[0]._RoomBookings;
			let dateFormatted = '';
			if (roomBooking?.start_time) {
				const d = new Date(roomBooking.start_time);
				dateFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
			}
			bkg = {
				title: roomBooking?._Movies?.title || roomBooking?.name || 'Evento',
				room: roomBooking?._Rooms?.name || 'Sala',
				date: dateFormatted,
				sts: tickets.map((t: any) => `${t._Seats?.row_identifier || ''}-${t._Seats?.column_number || ''}`),
			};
		}
		let cnc: any[] | undefined = undefined;
		if (hasConcessions) {
			cnc = concessions.map((c: any) => ({
				n: c.line_type === LINE_TYPE.PRODUCT ? c._Products?.name : c._Combos?.name,
				q: c.quantity,
			}));
		}
		const payload: any = { sub: order.id, cin: cinemaName };
		if (bkg) payload.bkg = bkg;
		if (cnc) payload.cnc = cnc;
		if (t_exp) payload.t_exp = t_exp;
		if (c_exp) payload.c_exp = c_exp;
		return JWTUtil.generateToken(payload, secret, expiresInSeconds);
	}

	/**
	 * Genera y guarda el QR de una orden de canje y encola el recibo por correo,
	 * reutilizando la misma cola que las compras normales (order-email-queue).
	 * El inventario NO se descuenta aquí (eso ocurre en el retiro en taquilla).
	 */
	async issueRedemptionReceipt(orderId: number, email: string | null): Promise<string> {
		const order = await this._orders.getOne(
			{ id: orderId },
			{ relations: [{ association: '_Cinemas', required: false }] },
		);
		if (!order) return '';

		const lines = await this._orderLines.getAll(
			{ count: false },
			{ order: orderId },
			{
				relations: [
					{ association: '_Products', required: false },
					{ association: '_Combos', required: false },
				],
			},
		);

		const qr = this.generateOrderQr(order, [], lines || []);
		await this._orders.update({ id: orderId }, { qr_code: qr });

		if (email) {
			QueueProvider.getInstance()
				.add('order-email-queue', 'send-order-email', { orderId, qrCode: qr, email })
				.catch((err: any) => console.error('No se pudo encolar el correo del recibo', err));
		}
		return qr;
	}

	/**
	 * Resuelve el correo del cliente (usuario verificado o email personal).
	 */
	async resolveCustomerEmail(customerId: number | null, session: any): Promise<string | null> {
		if (session && !session.roleCode && session.email) return session.email;

		if (customerId) {
			const customer = await this._customers.getById(customerId, {
				relations: [{ association: '_People', nested: [{ association: '_Users' }] }],
			});

			if (customer && customer._People) {
				if (customer._People._Users) {
					const users = Array.isArray(customer._People._Users)
						? customer._People._Users
						: [customer._People._Users];
					const verifiedUser = users.find((u: any) => u.signup_verified_at !== null && !u.deleted_at);
					if (verifiedUser && verifiedUser.email) return verifiedUser.email;
				}
				if (customer._People.personal_email) return customer._People.personal_email;
			}
		}
		return null;
	}
}

export default new OrderReceiptService();
