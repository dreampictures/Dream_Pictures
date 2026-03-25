import { z } from 'zod';
import { 
  insertContactMessageSchema, 
  portfolioItems, 
  contactMessages, 
  albums, 
  insertPortfolioSchema, 
  insertAlbumSchema 
} from './schema';
import { type AlbumResponse } from './schema';

export type { AlbumResponse };

const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const api = {
  portfolio: {
    list: {
      method: 'GET' as const,
      path: '/api/portfolio' as const,
      responses: {
        200: z.array(z.custom<typeof portfolioItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/admin/portfolio' as const,
      input: insertPortfolioSchema,
      responses: {
        201: z.custom<typeof portfolioItems.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  contact: {
    list: {
      method: 'GET' as const,
      path: '/api/admin/contacts' as const,
      responses: {
        200: z.array(z.custom<typeof contactMessages.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/contact' as const,
      input: insertContactMessageSchema,
      responses: {
        201: z.custom<typeof contactMessages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/admin/contacts/:id/status' as const,
      input: z.object({ status: z.string() }),
      responses: {
        200: z.custom<typeof contactMessages.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  albums: {
    list: {
      method: 'GET' as const,
      path: '/api/albums' as const,
      responses: {
        200: z.array(z.custom<typeof albums.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/albums/:code' as const,
      responses: {
        200: z.custom<AlbumResponse>(),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/admin/albums' as const,
      input: insertAlbumSchema,
      responses: {
        201: z.custom<typeof albums.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  }
};

export { errorSchemas, api };

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ContactMessageInput = z.infer<typeof api.contact.create.input>;
export type ContactMessageResponse = typeof contactMessages.$inferSelect;
export type PortfolioItemResponse = (typeof portfolioItems.$inferSelect)[];
