import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getAnalyticsTable, AnalyticsEntity } from '../lib/storage';

const eventSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  eventType: z.string(),
  eventData: z.record(z.unknown()),
  timestamp: z.string(),
  sessionId: z.string(),
  userAgent: z.string().optional(),
  language: z.string().optional(),
});

const eventsSchema = z.object({
  events: z.array(eventSchema),
});

export async function trackEvents(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json();
    const validation = eventsSchema.safeParse(body);

    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: validation.error.errors[0].message,
        },
      };
    }

    const { events } = validation.data;
    const analyticsTable = await getAnalyticsTable();

    // Batch insert events
    const entities: AnalyticsEntity[] = events.map((event) => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      return {
        partitionKey: date,
        rowKey: event.id || uuidv4(),
        id: event.id || uuidv4(),
        userId: event.userId || 'anonymous',
        eventType: event.eventType,
        eventData: JSON.stringify(event.eventData),
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        userAgent: event.userAgent,
        language: event.language,
      };
    });

    // Insert all events
    for (const entity of entities) {
      try {
        await analyticsTable.createEntity(entity);
      } catch (err) {
        // Ignore duplicate key errors
        context.warn('Failed to insert analytics event:', err);
      }
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        count: entities.length,
      },
    };
  } catch (error) {
    context.error('Track events error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'An error occurred while tracking events',
      },
    };
  }
}

app.http('trackEvents', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'analytics/events',
  handler: trackEvents,
});
