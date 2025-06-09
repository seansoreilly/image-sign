import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize DynamoDB client only if AWS configuration is available
let dynamoDBClient: DynamoDBClient | null = null;

try {
  if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    dynamoDBClient = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });
  }
} catch (error) {
  console.warn('AWS DynamoDB not configured, logging will be disabled:', error);
}

export enum LogEvent {
  SIGN = 'SIGN',
  VERIFY = 'VERIFY',
  VERIFY_SUCCESS = 'VERIFY_SUCCESS',
  VERIFY_FAIL = 'VERIFY_FAIL',
}

export interface LogEntry {
  id: string;
  timestamp: string;
  event: LogEvent;
  userId: string;
  imageHash: string;
  details: Record<string, any>;
}

export async function logAuditEvent(
  event: LogEvent,
  userId: string,
  imageHash: string,
  details: Record<string, any> = {}
): Promise<void> {
  const entry: LogEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    event,
    userId,
    imageHash,
    details,
  };

  // Log to console for development/debugging
  console.log('Audit Event:', {
    event: entry.event,
    userId: entry.userId,
    timestamp: entry.timestamp,
    details: entry.details
  });

  // Only attempt DynamoDB logging if client is configured
  if (!dynamoDBClient) {
    console.log('DynamoDB not configured, skipping database logging');
    return;
  }

  const command = new PutItemCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME || 'image-sign-audit-logs',
    Item: {
      id: { S: entry.id },
      timestamp: { S: entry.timestamp },
      event: { S: entry.event },
      userId: { S: entry.userId },
      imageHash: { S: entry.imageHash },
      details: { S: JSON.stringify(entry.details) },
    },
  });

  try {
    await dynamoDBClient.send(command);
    console.log('Successfully logged audit event to DynamoDB');
  } catch (error) {
    console.error('Failed to log audit event to DynamoDB:', error);
    // In a production environment, you might want to send this to a monitoring service
    // For now, we'll continue execution since logging failure shouldn't break the app
  }
} 