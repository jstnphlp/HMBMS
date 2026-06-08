export function mapPrismaError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("Unique constraint")) {
      return "A record with these details already exists.";
    }
    if (error.message.includes("Foreign key constraint")) {
      return "Related record not found. Please check your inputs.";
    }
    if (error.message.includes("Record to update not found")) {
      return "The record you are trying to update no longer exists.";
    }
    if (error.message.includes("Record to delete not found")) {
      return "The record you are trying to delete no longer exists.";
    }
  }
  return "An unexpected error occurred. Please try again.";
}
