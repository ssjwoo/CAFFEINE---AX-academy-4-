/**
 * API Client Aggregator for Admin Dashboard
 * 
 * This file re-exports all modularized API functions to ensure backward compatibility.
 * Imports from '@/api/client' will continue to work without changes.
 */

export * from './baseClient';
export * from './analysis';
export * from './transactions';
export * from './admin';
