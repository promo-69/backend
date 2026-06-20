export const USER_TYPE = {
	EMPLOYEE: 1,
	CUSTOMER: 2,
};

export const TTL_SECONDS = {
	RESET_CODE: 5 * 60,
	RESET_TOKEN: 5 * 60,
	ORDER_QUOTE: 10 * 60,
};

export const ORDER_STATUS = {
	PENDING: 1,
	PAID: 2,
	CANCELLED: 3,
	ONLINE_PAID: 4,
};

export const SHOPPING_SESSION_STATUS = {
	PENDING_ORDER: 'pending_order',
	PENDING_PAYMENT: 'pending_payment',
	PENDING_BILLING: 'pending_billing',
	COMPLETED: 'completed',
};

export const LINE_TYPE = {
	PRODUCT: 1,
	COMBO: 2,
};

export const PAYMENT_METHOD = {
	CASH: 1,
	POS: 2,
	MOBILE_PAYMENT: 3,
	BANK_TRANSFER: 4,
	LOYALTY_POINTS: 5,
};

export const LOYALTY_OPERATION = {
	EARN: 1,
	SPEND: 2,
};

export const VALIDATION_TYPE = {
	MANUAL: 1,
	QR: 2,
};

export const INVENTORY_OPERATION = {
	SALE: 4,
};

export const MODIFIER_SCOPE = {
	TICKETS: 1,
	PRODUCTS: 2,
	BOTH: 3,
};

export const TAX_SCOPE = {
	TICKETS: 1,
	PRODUCTS: 2,
	BOTH: 3,
};
