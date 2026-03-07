export const queryKeys = {
  userProfile: () => ['user', 'profile'] as const,
  userCategories: () => ['user', 'categories'] as const,
  userIdeas: () => ['user', 'ideas'] as const,
  userRooms: () => ['user', 'rooms'] as const,
} as const;
