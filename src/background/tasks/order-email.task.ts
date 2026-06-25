import { emailService } from '@services/email.service.js';
import { Database } from '@database/index.js';
import QRCode from 'qrcode';
import { Logger } from '@utils/logger.util.js';

/**
 * Tarea encargada de enviar el correo de confirmación (factura y QR) de una orden.
 */
export async function orderEmailTask(email: string, orderId: number, qrCode: string): Promise<void> {
	try {
		// 1. Obtener la orden con todas sus relaciones
		const orderRepo = Database.repository('main', 'orders') as any;
		const order = await orderRepo.getById(orderId, {
			relations: [
				{ association: '_Cinemas' },
				{
					association: '_OrderLines',
					nested: [{ association: '_Products' }, { association: '_Combos' }],
				},
				{
					association: '_Tickets',
					nested: [
						{ association: '_AudienceCategories' },
						{
							association: '_RoomBookings',
							nested: [
								{ association: '_Rooms' },
								{
									association: '_Showtimes',
									nested: [{ association: '_Movies' }],
								},
							],
						},
					],
				},
				{
					association: '_OrderPayments',
					nested: [{ association: '_PaymentMethods' }],
				},
				{ association: '_Currencies' },
			],
		});

		if (!order) {
			Logger.warn(`No se pudo enviar el correo de la orden ${orderId} porque no existe en DB.`);
			return;
		}

		// 2. Extraer datos para la plantilla
		const cinemaName = order._Cinemas ? order._Cinemas.name : 'Cineflix';

		// Confitería
		const confectioneryItems: any[] = [];
		if (order._OrderLines && Array.isArray(order._OrderLines)) {
			order._OrderLines.forEach((line: any) => {
				const itemName = line._Products?.name || line._Combos?.name || 'Artículo Desconocido';
				const qty = line.quantity;
				const unitPrice = Number(line.unit_price);
				confectioneryItems.push({
					name: itemName,
					quantity: qty,
					unitPrice: unitPrice.toFixed(2),
					totalPrice: (qty * unitPrice).toFixed(2),
				});
			});
		}

		// Boletos y Película
		let movieData = null;
		if (order._Tickets && Array.isArray(order._Tickets) && order._Tickets.length > 0) {
			const tickets = order._Tickets;
			const sampleTicket = tickets[0];
			const booking = sampleTicket._RoomBookings;

			// Determinar la película, horario y sala
			let title = 'Función';
			let roomName = 'Sala General';
			let date = booking ? booking.start_time : new Date();

			if (booking) {
				if (booking._Rooms) roomName = booking._Rooms.name;
				if (booking._Showtimes && Array.isArray(booking._Showtimes) && booking._Showtimes.length > 0) {
					const showtime = booking._Showtimes[0];
					if (showtime._Movies) title = showtime._Movies.title;
				}
			}

			// Agrupar los tickets por categoría para el listado (ej: 2x Adulto - $X)
			const categoriesMap = new Map<string, { count: number; unitPrice: number; total: number }>();
			tickets.forEach((t: any) => {
				const catName = t._AudienceCategories?.name || 'Boleto';
				const price = Number(t.price);
				if (categoriesMap.has(catName)) {
					const existing = categoriesMap.get(catName)!;
					existing.count += 1;
					existing.total += price;
				} else {
					categoriesMap.set(catName, { count: 1, unitPrice: price, total: price });
				}
			});

			const ticketsList = Array.from(categoriesMap.entries()).map(([name, data]) => ({
				name,
				count: data.count,
				unitPrice: data.unitPrice.toFixed(2),
				total: data.total.toFixed(2),
			}));

			movieData = {
				title,
				date,
				roomName,
				ticketsCount: tickets.length,
				ticketsList,
			};
		}

		// Pagos
		const payments: any[] = [];
		if (order._OrderPayments && Array.isArray(order._OrderPayments)) {
			order._OrderPayments.forEach((p: any) => {
				payments.push({
					method: p._PaymentMethods?.name || 'Pago',
					amount: Number(p.amount).toFixed(2),
					reference: p.reference_number || 'N/A'
				});
			});
		}

		const orderData = {
			id: order.id,
			total: Number(order.total_amount_base_currency).toFixed(2),
			cinemaName,
			currencySymbol: order._Currencies?.symbol || 'Bs.',
			movieData,
			confectioneryItems,
			payments,
		};

		// 3. Generar el QR Base64 para la imagen incrustada
		let qrBase64 = '';
		try {
			qrBase64 = await QRCode.toDataURL(qrCode, { margin: 1, width: 250, errorCorrectionLevel: 'H' });
		} catch (qrErr: any) {
			Logger.error('Error generando QR para el correo:', qrErr);
			qrBase64 = '';
		}

		// 4. Enviar correo
		await emailService.sendOrderInvoiceEmail(email, orderData, qrBase64);
	} catch (error: any) {
		Logger.error(`Error procesando envío de correo de la orden ${orderId}:`, error);
	}
}
