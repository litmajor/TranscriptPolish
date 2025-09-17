# Overview

This is a web application for transcribing and processing police interview transcripts, specifically designed for the Las Vegas Metropolitan Police Department (LVMPD). The application allows users to upload transcript files, edit them with real-time validation, apply automated processing rules for standardization, and manage speaker identification systems. It provides a comprehensive workflow from raw transcript upload to formatted, standardized output that meets police department requirements.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Extensive use of shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with a custom design system featuring CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with CRUD operations for transcript management
- **File Processing**: Multer middleware for handling file uploads
- **Development Mode**: Vite integration for hot module replacement during development

## Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM
- **Connection**: Neon Database serverless PostgreSQL adapter
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Development Storage**: In-memory storage implementation for development/testing
- **Storage Interface**: Abstract storage interface allowing for multiple backend implementations

## Data Models
- **Transcript Schema**: Comprehensive transcript model including:
  - File metadata (filename, timestamps)
  - Content fields (original and processed content)
  - LVMPD-specific metadata (detective info, interview details)
  - Speaker system configuration (standard vs custom speakers)
  - Validation results and processing status
  - JSON fields for flexible metadata storage

## Application Features
- **Real-time Validation**: Live validation of transcript format compliance with LVMPD standards
- **Processing Engine**: Automated text processing with configurable rules for standardizing:
  - Discourse markers (Mh, mmhm, uh)
  - Number formatting (spelling out 1-10)
  - Date formatting (removing ordinals)
  - Time standardization
- **Speaker Management**: Flexible speaker identification system supporting both standard Q&A format and custom speaker labels
- **Template System**: LVMPD-specific template forms for capturing detective and interview metadata

## Validation System
- **Rule Engine**: Configurable validation rules checking for:
  - Proper speaker identification
  - Format compliance
  - Discourse marker standardization
  - Number formatting consistency
- **Real-time Feedback**: Live validation with issue reporting, suggestions, and severity levels
- **Scoring System**: Automated quality scoring based on validation results

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm** and **drizzle-kit**: Type-safe ORM with migration management
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation integration
- **zod**: Schema validation and type inference

## UI Component Libraries
- **@radix-ui/***: Comprehensive set of accessible UI primitives including dialogs, dropdowns, forms, and navigation components
- **class-variance-authority**: Utility for managing component variants
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

## File Handling
- **multer**: Multipart form data handling for file uploads
- **react-dropzone**: Drag-and-drop file upload interface

## Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **@replit/vite-plugin-***: Replit-specific development plugins for error handling and debugging

## Utilities
- **date-fns**: Date manipulation and formatting
- **clsx** and **tailwind-merge**: CSS class management utilities
- **wouter**: Lightweight routing solution
- **nanoid**: Unique ID generation