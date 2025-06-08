import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

export enum LogEvent {
  SIGN = 'SIGN',
  VERIFY = 'VERIFY',
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
  details: Record<string, any>
): Promise<void> {
  const entry: LogEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    event,
    userId,
    imageHash,
    details,
  };

  const command = new PutItemCommand({
    TableName: 'image-sign-audit-logs',
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
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // In a production environment, you might want to send this to a monitoring service
  }
} 