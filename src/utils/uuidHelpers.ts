export const sanitizeUUID = (value: string | null | undefined): string | null => {
  if (!value || value.trim() === '') {
    return null;
  }
  return value.trim();
};

export const sanitizeUUIDs = <T extends Record<string, any>>(
  obj: T,
  uuidFields: (keyof T)[]
): T => {
  const sanitized = { ...obj };
  for (const field of uuidFields) {
    if (field in sanitized) {
      sanitized[field] = sanitizeUUID(sanitized[field] as any) as any;
    }
  }
  return sanitized;
};
