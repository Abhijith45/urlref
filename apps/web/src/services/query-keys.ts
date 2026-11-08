export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  links: {
    all: ['links'] as const,
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      ['links', 'list', params] as const,
    detail: (id: string) => ['links', 'detail', id] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    overview: (params?: { from?: string; to?: string }) =>
      ['analytics', 'overview', params] as const,
    link: (id: string, params?: { from?: string; to?: string }) =>
      ['analytics', 'link', id, params] as const,
  },
};
