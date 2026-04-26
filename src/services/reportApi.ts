/**
 * Report Integration API Service (reportApi.ts)
 * 
 * Centralized service module responsible for orchestrating network requests to the ASP.NET Core backend.
 * Handles the secure transmission of analysis payloads, retrieval of historical datasets, 
 * and automatically injects JWT Authentication Bearer tokens into request headers to satisfy backend authorization policies.
 */

const API_URL = 'http://localhost:5165/api/reports';

/**
 * Authorization Header Interceptor Setup
 * Dynamically queries LocalStorage to construct HTTP headers equipped with the currently active JWT signature.
 * Ensures strict security adherence for all endpoints strictly decorated with `[Authorize]` attributes in the C# controllers.
 */
function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}), // Spread syntax ensures Bearer is omitted if the token resolves as null
    };
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs) & SCHEMA CONTRACTS
// ============================================================================

/**
 * Payload Schema: Generate New Report
 * Models the HTTP POST body expected by the backend to initiate a new Web Scraping and ML pipeline invocation.
 */
export interface GenerateReportRequest {
    city: string; // Target location for sentiment scraping
    sources: string[]; // List of platform string identifiers (e.g., ['GoogleMaps'])
    dateFrom: string; // ISO8601 Date string bound
    dateTo: string; // ISO8601 Date string bound
    limit?: number; // Optional ceiling for maximum reviews scraped to manage ML overhead
}

/**
 * Schema: Report Dashboard Summary
 * Minimized representation of a database report designed specifically for List/Table grid rendering,
 * stripping out heavyweight BLOB values (like reportJson) to radically improve query latency.
 */
export interface ReportSummary {
    id: string; // UUID primary key mapped locally
    city: string;
    sources: string[];
    dateFrom: string;
    dateTo: string;
    status: string; // Status indicator (e.g., 'Completed', 'Processing')
    createdAt: string; // ISO timestamp correlating directly with backend Entity Framework DateTime
    totalReviews: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
}

/**
 * Schema: Comprehensive Report Entity Root
 * Heavyweight object payload representing an entire analysis session,
 * complete with the serializable ML JSON mapping arrays.
 */
export interface ReportDetail {
    id: string;
    city: string;
    sources: string[];
    dateFrom: string;
    dateTo: string;
    status: string;
    modelVersion: string; // Tracks the Hugging Face AI iteration used at the time of execution
    createdAt: string;
    updatedAt: string;
    totalReviews: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    reportJson: string | null; // Complex nested JSON blob payload containing literal mapped reviews and D3 arrays
}

// ============================================================================
// ASYNCHRONOUS NETWORK METHODS (CRUD OPERATIONS)
// ============================================================================

/**
 * Instructs the backend API gateway to trigger the Python Microservice execution
 * to scrape and analyze new destination data.
 * @param dto Contains city, boundaries, and optional scraped limits.
 */
export async function generateReport(dto: GenerateReportRequest): Promise<ReportDetail> {
    const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to generate report schema');
    }

    return response.json();
}

/**
 * Retrieves a paginated history array of prior reports generated under the active user's UUID.
 * @param limit Constraint ceiling to limit payload bloat (defaults heavily to 20).
 */
export async function getReports(limit: number = 20): Promise<ReportSummary[]> {
    const response = await fetch(`${API_URL}?limit=${limit}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to resolve historical reports mapping');
    }

    return response.json(); // Deserializes JSON string mapped back to the defined interface structure
}

/**
 * Fetches the most recent analysis operation completed by the active user.
 * Frequently used to dynamically hydrate Dashboard UI when bypassing URL UUID parameters.
 */
export async function getLatestReport(): Promise<ReportDetail | null> {
    const response = await fetch(`${API_URL}/latest`, {
        headers: getAuthHeaders(),
    });

    if (response.status === 404) {
        return null; // Gracefully degenerate if the account profile is entirely blank
    }

    if (!response.ok) {
        throw new Error('Failed to fetch the most recent cached report');
    }

    return response.json();
}

/**
 * Single Database Fetch utilizing exact Primary Key matching indices.
 * Triggers primarily from Sidebar navigation selections.
 */
export async function getReportById(id: string): Promise<ReportDetail> {
    const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Requested database report ID returned 404 Not Found');
    }

    return response.json();
}
