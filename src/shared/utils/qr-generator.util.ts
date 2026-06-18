import QRCode from 'qrcode';

export class QRGeneratorUtil {

  /**
   * Genera un QR en formato Buffer (Ideal para adjuntos o CID en correos)
   */
  static async generateAsBuffer(data: string): Promise<Buffer> {
    return QRCode.toBuffer(data, {
		errorCorrectionLevel: 'H',
		margin: 2,
		width: 300,
		color: { dark: '#000000', light: '#FFFFFF' }
    });
  }

  /**
   * Genera un QR en formato Base64 (Ideal para inyectar en HTML o enviar por API)
   */
  static async generateAsBase64(data: string): Promise<string> {
    return QRCode.toDataURL(data, {
		errorCorrectionLevel: 'H',
		width: 300
    });
  }
}
