import { TableClient, TableServiceClient } from '@azure/data-tables';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || 'UseDevelopmentStorage=true';

// Table clients
let usersTableClient: TableClient;
let resumesTableClient: TableClient;
let analyticsTableClient: TableClient;
let sessionsTableClient: TableClient;

// Blob container client
let resumesBlobClient: ContainerClient;

export const getTableClient = async (tableName: string): Promise<TableClient> => {
  const client = TableClient.fromConnectionString(connectionString, tableName);
  await client.createTable().catch(() => {}); // Ignore if exists
  return client;
};

export const getUsersTable = async (): Promise<TableClient> => {
  if (!usersTableClient) {
    usersTableClient = await getTableClient('users');
  }
  return usersTableClient;
};

export const getResumesTable = async (): Promise<TableClient> => {
  if (!resumesTableClient) {
    resumesTableClient = await getTableClient('resumes');
  }
  return resumesTableClient;
};

export const getAnalyticsTable = async (): Promise<TableClient> => {
  if (!analyticsTableClient) {
    analyticsTableClient = await getTableClient('analytics');
  }
  return analyticsTableClient;
};

export const getSessionsTable = async (): Promise<TableClient> => {
  if (!sessionsTableClient) {
    sessionsTableClient = await getTableClient('sessions');
  }
  return sessionsTableClient;
};

export const getResumesBlobContainer = async (): Promise<ContainerClient> => {
  if (!resumesBlobClient) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    resumesBlobClient = blobServiceClient.getContainerClient('resumes');
    // SECURITY: Use private access - blobs require authenticated access via SAS tokens
    await resumesBlobClient.createIfNotExists(); // defaults to private (no public access)
  }
  return resumesBlobClient;
};

// Entity interfaces
export interface UserEntity {
  partitionKey: string; // 'users'
  rowKey: string; // email (normalized)
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  language?: string;
}

export interface ResumeEntity {
  partitionKey: string; // userId
  rowKey: string; // resumeId
  id: string;
  userId: string;
  data: string; // JSON stringified ResumeData
  templateStyle: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  pdfBlobUrl?: string;
  docxBlobUrl?: string;
}

export interface AnalyticsEntity {
  partitionKey: string; // date (YYYY-MM-DD)
  rowKey: string; // eventId
  id: string;
  userId: string;
  eventType: string;
  eventData: string; // JSON stringified
  timestamp: string;
  sessionId: string;
  userAgent?: string;
  language?: string;
}

export interface SessionEntity {
  partitionKey: string; // 'sessions'
  rowKey: string; // sessionId
  userId: string;
  refreshToken: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
}
