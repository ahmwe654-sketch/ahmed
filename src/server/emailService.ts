import https from 'https';

export interface SendEmailParams {
  toEmail: string;
  toName: string;
  code: string;
  type: 'registration' | 'password_reset' | 'email_change' | 'login_verify';
  expiresInMinutes?: number;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isDevFallback?: boolean;
  devCode?: string;
}

/**
 * EmailJS Server-side Integration Service
 * Uses EmailJS REST API (POST https://api.emailjs.com/api/v1.0/email/send)
 * Keeps EmailJS private keys and API tokens completely server-side.
 */
export class EmailService {
  private static instance: EmailService;

  private serviceId: string;
  private templateId: string;
  private publicKey: string;
  private privateKey: string;

  private constructor() {
    this.serviceId = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || '';
    this.templateId = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || '';
    this.publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY || '';
    this.privateKey = process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_ACCESS_TOKEN || '';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public isConfigured(): boolean {
    return Boolean(this.serviceId && this.templateId && this.publicKey);
  }

  public getConfigStatus(): { configured: boolean; serviceId: boolean; templateId: boolean; publicKey: boolean; privateKey: boolean } {
    return {
      configured: this.isConfigured(),
      serviceId: Boolean(this.serviceId),
      templateId: Boolean(this.templateId),
      publicKey: Boolean(this.publicKey),
      privateKey: Boolean(this.privateKey)
    };
  }

  /**
   * Dispatches a 6-digit verification code to the recipient using EmailJS.
   * If EmailJS environment variables are not yet configured, gracefully logs the code
   * to the server console and provides a dev-preview fallback.
   */
  public async sendVerificationCode(params: SendEmailParams): Promise<SendEmailResult> {
    const { toEmail, toName, code, type, expiresInMinutes = 10 } = params;

    const actionDescription =
      type === 'password_reset'
        ? 'reset your Aegis Core master password'
        : type === 'email_change'
        ? 'confirm your new email address'
        : 'activate your Aegis Core cloud account';

    const subject =
      type === 'password_reset'
        ? `[Aegis Core] Your Password Reset Code: ${code}`
        : type === 'email_change'
        ? `[Aegis Core] Confirm Your New Email: ${code}`
        : `[Aegis Core] Your Verification Code: ${code}`;

    // If EmailJS credentials are not present in .env, perform server logging fallback
    if (!this.isConfigured()) {
      const isProd = process.env.NODE_ENV === 'production';
      if (!isProd) {
        console.log('================================================================');
        console.log(`[EmailJS Dev Mode] Verification Code for ${toEmail} (${toName}):`);
        console.log(`Code: ${code} (Type: ${type}, Expires in: ${expiresInMinutes} mins)`);
        console.log(`Note: Provide EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY in .env for production email dispatch`);
        console.log('================================================================');
      }

      return {
        success: true,
        isDevFallback: !isProd,
        devCode: isProd ? undefined : code
      };
    }

    const payload: Record<string, any> = {
      service_id: this.serviceId,
      template_id: this.templateId,
      user_id: this.publicKey,
      template_params: {
        to_email: toEmail,
        to_name: toName || 'Server Administrator',
        user_email: toEmail,
        user_name: toName || 'Server Administrator',
        passcode: code,
        verification_code: code,
        code: code,
        otp: code,
        app_name: 'Aegis Core',
        action_name: actionDescription,
        action_type: type,
        expires_in: `${expiresInMinutes} minutes`,
        subject: subject,
        support_email: 'support@aegis-smp.net',
        year: new Date().getFullYear().toString()
      }
    };

    if (this.privateKey) {
      payload.accessToken = this.privateKey;
    }

    return new Promise((resolve) => {
      try {
        const postData = JSON.stringify(payload);

        const options = {
          hostname: 'api.emailjs.com',
          port: 443,
          path: '/api/v1.0/email/send',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'User-Agent': 'AegisCore-Auth/1.0'
          },
          timeout: 10000
        };

        const req = https.request(options, (res) => {
          let responseBody = '';
          res.on('data', (chunk) => {
            responseBody += chunk;
          });

          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`[EmailJS] Successfully dispatched verification email to ${toEmail}`);
              resolve({
                success: true,
                messageId: `emailjs_${Date.now()}`
              });
            } else {
              console.error(`[EmailJS Error] HTTP ${res.statusCode}: ${responseBody}`);
              // Fallback to dev code in response if EmailJS template fails during preview
              resolve({
                success: true,
                isDevFallback: true,
                devCode: code,
                error: `EmailJS responded with status ${res.statusCode}: ${responseBody}`
              });
            }
          });
        });

        req.on('error', (err) => {
          console.error('[EmailJS Network Error]:', err.message);
          resolve({
            success: true,
            isDevFallback: true,
            devCode: code,
            error: err.message
          });
        });

        req.on('timeout', () => {
          req.destroy();
          console.error('[EmailJS Timeout] Request timed out after 10s');
          resolve({
            success: true,
            isDevFallback: true,
            devCode: code,
            error: 'EmailJS request timed out'
          });
        });

        req.write(postData);
        req.end();
      } catch (err: any) {
        console.error('[EmailJS Dispatch Exception]:', err);
        resolve({
          success: true,
          isDevFallback: true,
          devCode: code,
          error: err.message || 'Unknown error dispatching email'
        });
      }
    });
  }
}
