class RetryStrategy {
  calculateDelay(attempt) {
    return Math.pow(2, attempt) * 1000; // Adjust delay as needed
  }
}

class TokenBucketRateLimiter {
  constructor(rate = 10, windowMs = 60000) {
    this.rate = rate;
    this.windowMs = windowMs;
    this.tokens = rate;
    this.lastRefill = Date.now();
  }

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToRefill = Math.floor(elapsed / this.windowMs) * this.rate;
    this.tokens = Math.min(this.tokens + tokensToRefill, this.rate);
    this.lastRefill = now;

    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    } else {
      return new Promise(resolve => setTimeout(resolve, this.windowMs - elapsed));
    }
  }
}

class StatusTracker {
  constructor() {
    this.sentEmails = new Map();
  }

  trackSuccess(recipient, providerName) {
    this.sentEmails.set(recipient, {
      status: 'success',
      provider: providerName,
      timestamp: Date.now()
    });
  }

  trackFailure(recipient, providerName, error) {
    this.sentEmails.set(recipient, {
      status: 'failure',
      provider: providerName,
      timestamp: Date.now(),
      error: error.message
    });
  }

  getSentEmails() {
    return Array.from(this.sentEmails.values());
  }

  getSentEmailStatus(recipient) {
    const emailData = this.sentEmails.get(recipient);
    return emailData ? emailData.status : null;
  }

}

class CircuitBreaker {
  constructor(failureThreshold = 5, timeoutMs = 60000) {
    this.failureThreshold = failureThreshold;
    this.timeoutMs = timeoutMs;
    this.failureCount = 0;
    this.lastFailure = null;
  }

  incrementFailureCount() {
    this.failureCount++;
    this.lastFailure = Date.now();
  }

  reset() {
    this.failureCount = 0;
    this.lastFailure = null;
  }

  async wait() {
    if (this.failureCount >= this.failureThreshold) {
      const now = Date.now();
      if (this.lastFailure && now - this.lastFailure < this.timeoutMs) {
        return new Promise(resolve => setTimeout(resolve, this.timeoutMs - (now - this.lastFailure)));
      } else {
        this.reset();
      }
    }
    return Promise.resolve();
  }
}

class EmailService {
  constructor(providers) {
    this.providers = providers;
    this.retryStrategy = new RetryStrategy();
    this.rateLimiter = new TokenBucketRateLimiter();
    this.statusTracker = new StatusTracker();
    this.circuitBreaker = new CircuitBreaker();
  }

  async sendEmail(recipient, subject, body) {
    let success = false;
    let currentProviderIndex = 0;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[currentProviderIndex];

      try {
        await this.rateLimiter.wait();
        await this.circuitBreaker.wait();
        const result = await provider.sendEmail(recipient, subject, body);

        if (result) {
          success = true;
          this.statusTracker.trackSuccess(recipient, provider.name);
          this.circuitBreaker.reset();
          break;
        } else {
          this.statusTracker.trackFailure(recipient, provider.name);
          currentProviderIndex = (currentProviderIndex + 1) % this.providers.length;
        }
      } catch (error) {
        this.statusTracker.trackFailure(recipient, provider.name, error);
        currentProviderIndex = (currentProviderIndex + 1) % this.providers.length;
        this.circuitBreaker.incrementFailureCount();
      }
    }

    return success;
  }
}

// Example usage
const mockProvider1 = {
  sendEmail: () => Promise.resolve(Math.random() > 0.2)
};

const mockProvider2 = {
  sendEmail: () => Promise.resolve(Math.random() > 0.3)
};

const emailService = new EmailService([mockProvider1, mockProvider2]);

emailService.sendEmail('recipient@example.com', 'Subject', 'Body')
  .then(() => console.log('Email sent successfully'))
  .catch(error => console.error('Failed to send email:', error));