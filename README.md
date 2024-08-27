Title: Resilient Email Sending Service in JavaScript

Description:
Purpose of the service: to send emails reliably with features like retry, fallback, rate limiting, and status tracking.

Installation:
No additional installations are required for this code.

Usage:
1. Import the EmailService class:
import { EmailService } from './Email_sending_service';

2. Create an instance of EmailService:
const mockProvider1 = {
  sendEmail: () => Promise.resolve(Math.random() > 0.2) // Simulate email sending
};
const mockProvider2 = {
  sendEmail: () => Promise.resolve(Math.random() > 0.3) // Simulate email sending
};
const emailService = new EmailService([mockProvider1, mockProvider2]);

3. Send an email:
JavaScript
emailService.sendEmail('recipient@example.com', 'Subject', 'Body')
  .then(() => console.log('Email sent successfully'))
  .catch(error => console.error('Failed to send email:', error));

Documentation:
Lists the classes and their functionalities:
RetryStrategy
TokenBucketRateLimiter
StatusTracker
CircuitBreaker 
EmailService

Contributing:
Invites contributions from others for improvements or bug fixes.
