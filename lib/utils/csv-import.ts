/**
 * CSV Import utility functions
 */

export interface CSVRow {
  [key: string]: string;
}

export interface CSVImportError {
  row: number;
  field: string;
  message: string;
}

export interface CSVParseResult<T> {
  data: T[];
  errors: CSVImportError[];
  warnings: string[];
}

/**
 * Parse CSV file content into rows
 */
export function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  // Detect delimiter (comma or semicolon)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(',') ? ',' : firstLine.includes(';') ? ';' : ',';

  // Parse header
  const headers = parseCSVLine(lines[0], delimiter).map((h) => h.trim().toLowerCase());

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    if (values.length === 0 || values.every((v) => !v.trim())) continue; // Skip empty rows

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current);

  return values;
}

/**
 * Validate and map CSV rows to ServiceRequest format
 */
export interface ServiceRequestCSVRow {
  name: string;
  phone: string;
  service: string;
  address: string;
  approvedCredits?: number;
  usedCredits?: number;
  remainingCredits?: number;
  status?: 'Approved' | 'Pending' | 'Draft' | 'Rejected';
  preferredStaff?: string[];
  preferredDays?: string[];
}

export function validateAndMapServiceRequests(
  csvRows: CSVRow[],
  columnMapping?: { [csvColumn: string]: string }
): CSVParseResult<ServiceRequestCSVRow> {
  const data: ServiceRequestCSVRow[] = [];
  const errors: CSVImportError[] = [];
  const warnings: string[] = [];

  // Default column mapping (case-insensitive)
  const defaultMapping: { [key: string]: string } = {
    name: 'name',
    phone: 'phone',
    service: 'service',
    address: 'address',
    'approved credits': 'approvedCredits',
    'used credits': 'usedCredits',
    'remaining credits': 'remainingCredits',
    status: 'status',
    'preferred staff': 'preferredStaff',
    'preferred days': 'preferredDays',
  };

  const mapping = { ...defaultMapping, ...columnMapping };

  csvRows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because row 1 is header, and arrays are 0-indexed
    const mappedRow: Partial<ServiceRequestCSVRow> = {};

    // Map required fields
    const nameField = findColumn(row, mapping.name);
    const phoneField = findColumn(row, mapping.phone);
    const serviceField = findColumn(row, mapping.service);
    const addressField = findColumn(row, mapping.address);

    if (!nameField) {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Name is required',
      });
      return;
    }
    mappedRow.name = nameField;

    if (!phoneField) {
      errors.push({
        row: rowNumber,
        field: 'phone',
        message: 'Phone is required',
      });
      return;
    }
    mappedRow.phone = phoneField;

    if (!serviceField) {
      errors.push({
        row: rowNumber,
        field: 'service',
        message: 'Service is required',
      });
      return;
    }
    mappedRow.service = serviceField;

    if (!addressField) {
      errors.push({
        row: rowNumber,
        field: 'address',
        message: 'Address is required',
      });
      return;
    }
    mappedRow.address = addressField;

    // Map optional fields
    const approvedCreditsField = findColumn(row, mapping.approvedCredits);
    if (approvedCreditsField) {
      const num = parseFloat(approvedCreditsField);
      if (isNaN(num)) {
        warnings.push(`Row ${rowNumber}: Invalid approved credits value, using 0`);
        mappedRow.approvedCredits = 0;
      } else {
        mappedRow.approvedCredits = Math.max(0, num);
      }
    } else {
      mappedRow.approvedCredits = 0;
    }

    const usedCreditsField = findColumn(row, mapping.usedCredits);
    if (usedCreditsField) {
      const num = parseFloat(usedCreditsField);
      if (isNaN(num)) {
        warnings.push(`Row ${rowNumber}: Invalid used credits value, using 0`);
        mappedRow.usedCredits = 0;
      } else {
        mappedRow.usedCredits = Math.max(0, num);
      }
    } else {
      mappedRow.usedCredits = 0;
    }

    const remainingCreditsField = findColumn(row, mapping.remainingCredits);
    if (remainingCreditsField) {
      const num = parseFloat(remainingCreditsField);
      if (isNaN(num)) {
        warnings.push(`Row ${rowNumber}: Invalid remaining credits value, using 0`);
        mappedRow.remainingCredits = 0;
      } else {
        mappedRow.remainingCredits = Math.max(0, num);
      }
    } else {
      // Calculate remaining if not provided
      mappedRow.remainingCredits = (mappedRow.approvedCredits || 0) - (mappedRow.usedCredits || 0);
    }

    const statusField = findColumn(row, mapping.status);
    if (statusField) {
      const validStatuses: ('Approved' | 'Pending' | 'Draft' | 'Rejected')[] = [
        'Approved',
        'Pending',
        'Draft',
        'Rejected',
      ];
      const normalizedStatus = statusField.trim() as ServiceRequestCSVRow['status'];
      if (normalizedStatus && validStatuses.includes(normalizedStatus)) {
        mappedRow.status = normalizedStatus;
      } else {
        warnings.push(`Row ${rowNumber}: Invalid status "${statusField}", using "Draft"`);
        mappedRow.status = 'Draft';
      }
    } else {
      mappedRow.status = 'Draft';
    }

    const preferredStaffField = findColumn(row, mapping.preferredStaff);
    if (preferredStaffField) {
      mappedRow.preferredStaff = preferredStaffField
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else {
      mappedRow.preferredStaff = [];
    }

    const preferredDaysField = findColumn(row, mapping.preferredDays);
    if (preferredDaysField) {
      mappedRow.preferredDays = preferredDaysField
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
    } else {
      mappedRow.preferredDays = [];
    }

    data.push(mappedRow as ServiceRequestCSVRow);
  });

  return { data, errors, warnings };
}

/**
 * Find column value by case-insensitive key matching
 */
function findColumn(row: CSVRow, key: string | undefined): string | undefined {
  if (!key) return undefined;

  // Try exact match first
  if (row[key]) return row[key];

  // Try case-insensitive match
  const lowerKey = key.toLowerCase();
  for (const [rowKey, value] of Object.entries(row)) {
    if (rowKey.toLowerCase() === lowerKey) {
      return value;
    }
  }

  return undefined;
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
