// ===================================================================
// EmailService.cs
// Sends bilingual (Arabic/English) OTP emails via Gmail SMTP.
// Supports two purposes: "verification" (registration/login) and
// "reset" (password recovery). Uses an app-specific Gmail password.
// ===================================================================
using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SmartTourism.API.Services
{
    // Contract used by AuthController — allows mocking/substitution in tests
    public interface IEmailService
    {
        Task<bool> SendVerificationEmailAsync(string receiverEmail, string code, string purpose = "verification");
    }


    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Sends a 6-digit OTP email. Purpose determines the subject line and body template.
        /// Returns true on success, false on any SMTP failure.
        /// </summary>
        public async Task<bool> SendVerificationEmailAsync(string receiverEmail, string code, string purpose = "verification")
        {
            var senderEmail = "touralyzesupport@gmail.com";
            var senderPassword = "puoa yuuc mzpf zpzc"; // Gmail App Password (not the account password)
            var expiryMinutes = 5;                       // OTP lifetime shown in the email body

            // Subject line differs between password reset and standard verification
            var subject = purpose == "reset" 
                ? "استرجاع كلمة المرور | Password Reset" 
                : "كود التحقق | Verification Code";

            var body = purpose == "reset" ? $@"
مرحباً،

لقد طلبت استرجاع كلمة المرور الخاصة بك.
كود التحقق هو: {code}

ملاحظة: هذا الكود صالح لمدة {expiryMinutes} دقائق فقط.
إذا لم تطلب استرجاع كلمة المرور، يرجى تجاهل هذه الرسالة.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hello,

You have requested to reset your password.
Your verification code is: {code}

Note: This code is valid for {expiryMinutes} minutes only.
If you did not request a password reset, please ignore this message.
" : $@"
مرحباً،

كود التحقق الخاص بك هو: {code}

ملاحظة: هذا الكود صالح لمدة {expiryMinutes} دقائق فقط.
إذا لم تطلب هذا الكود، يرجى تجاهل هذه الرسالة.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hello,

Your verification code is: {code}

Note: This code is valid for {expiryMinutes} minutes only.
If you did not request this code, please ignore this message.
";

            try
            {
                // Configure Gmail SMTP client with TLS on port 587
                using var client = new SmtpClient("smtp.gmail.com", 587)
                {
                    Credentials = new NetworkCredential(senderEmail, senderPassword),
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, "Smart Tourism System"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = false // Plain-text body (bilingual Arabic/English)
                };
                
                mailMessage.To.Add(receiverEmail);

                await client.SendMailAsync(mailMessage);
                return true;
            }
            catch (Exception ex)
            {
                // Log the error but don't throw — caller receives false and handles gracefully
                _logger.LogError(ex, "Failed to send email to {Receiver}", receiverEmail);
                return false;
            }
        }
    }
}
