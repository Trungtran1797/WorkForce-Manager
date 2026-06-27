export interface UserEmailConfig {
  provider: 'Gmail' | 'ImapSmtp';
  emailAddress: string;
  
  // IMAP Configuration
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapPassword?: string;
  hasImapPassword?: boolean;

  // SMTP Configuration
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  hasSmtpPassword?: boolean;
  
  useSsl: boolean;

  // Gmail Configuration
  hasGmailRefreshToken?: boolean;
  gmailAccessToken?: string;
  gmailRefreshToken?: string;

  // AI Configuration
  aiProvider?: string;
  aiModel?: string;
  aiApiKey?: string;
  hasAiApiKey?: boolean;
}

export interface EmailMessage {
  messageId: string;
  subject: string;
  from: string;
  to: string;
  date?: string;
  snippet: string;
  body: string;
  isRead: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
