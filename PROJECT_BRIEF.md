# Project Brief: Company Admin Portal

## Overview

A comprehensive admin portal for managing service-based businesses, specifically designed for Geowise's dispatch platform. The system enables companies to manage service requests, dispatch providers, track customer credits, and coordinate bookings across geographic zones.

## Problem Statement

Service-based businesses need a centralized platform to:
- Manage incoming service requests from customers
- Track customer credits and service allocations
- Automatically dispatch providers to service requests
- Coordinate bookings across multiple providers and service zones
- Import bulk service requests from external sources (Excel)
- Monitor service delivery and provider availability

## Solution

A Next.js-based admin portal that provides:

1. **Service Request Management** - Create, import, and track service requests with automatic customer creation
2. **Auto-Dispatch System** - Match service requests with approved credits and automatically generate bookings
3. **Provider Management** - Manage linked users (providers/staff) and their service assignments
4. **Credit Tracking** - Monitor approved, used, and remaining credits per customer per service
5. **Geographic Zoning** - Define and manage service zones for efficient provider routing
6. **Calendar & Scheduling** - Visual calendar interface for viewing and managing bookings
7. **Bulk Operations** - Excel import for mass service request creation

## Key Features

### Service Requests
- Multi-step form for creating service requests
- Excel import with field mapping
- Customer autocomplete (derived from existing service requests)
- Location autocomplete via Google Maps
- Service dropdown with existing services only
- Automatic customer creation when new names are entered

### Auto-Dispatch
- Matches service requests with approved user credits
- Filters out requests with zero remaining credits
- Generates bookings automatically
- Supports dev/production environment separation for testing

### Credits Management
- Add/edit customer credits with recurring periods (days/hours)
- Track credit usage and remaining balances
- Create new customers during credit assignment
- View credit history per customer

### Provider Management
- Link users as providers/staff
- Assign providers to services
- Manage provider availability and zones

## Technical Architecture

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui component library
- **State Management:** Zustand for client state
- **Forms:** React Hook Form + Zod validation
- **API:** Server actions with Axios for backend communication
- **Maps:** Google Maps API for location services

## Environment Configuration

The system supports dual-environment operation:
- **Production:** Default API endpoint for live operations (HTTPS)
- **Development:** Separate HTTPS API endpoint for testing (via `NEXT_PUBLIC_SERVICE_REQUESTS_API_URL`)

**Important:** The dev environment requires HTTPS (SSL certificate) to avoid mixed content security issues when the frontend is served over HTTPS. Both environments use secure connections.

This allows safe testing of imports, auto-dispatch, and credit management without affecting production data.

## Target Users

- Company administrators managing service operations
- Operations staff coordinating service delivery
- Customer service representatives creating service requests

## Business Value

- **Efficiency:** Automated dispatch reduces manual coordination effort
- **Accuracy:** Centralized credit tracking prevents over-allocation
- **Scalability:** Bulk import supports high-volume operations
- **Visibility:** Calendar and dashboard provide real-time operational insights
- **Flexibility:** Geographic zoning enables optimized provider routing

## Current Status

The portal is operational with core features implemented. Ongoing improvements focus on:
- Enhanced customer/provider filtering
- Improved error handling and user feedback
- Backend integration refinements for import workflows
