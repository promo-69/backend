export interface EmailTemplateData {
	[key: string]: any;
}

export interface EmailResult {
	subject: string;
	html: string;
	text?: string;
}

export interface EmailTemplate {
	name: string;
	description: string;
	variables: Array<{
		name: string;
		type: string;
		required: boolean;
		description: string;
	}>;
	template: (data: EmailTemplateData) => EmailResult;
}

export interface EmailAccountConfig {
	email: string;
	password: string;
	service?: 'gmail' | 'outlook' | 'yahoo' | 'smtp';
	host?: string;
	port?: number;
	secure?: boolean;
	name?: string;
}

export interface SendMailOptions {
	to: string | string[];
	subject: string;
	html: string;
	text?: string;
	cc?: string | string[];
	bcc?: string | string[];
	attachments?: Array<{
		filename: string;
		content?: string | Buffer;
		path?: string;
		contentType?: string;
	}>;
}
