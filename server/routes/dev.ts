// Development routes for testing without external dependencies
import type { Express } from "express";

export function registerDevRoutes(app: Express) {
  // Only enable in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log('Development routes disabled for production setup...');
  
}