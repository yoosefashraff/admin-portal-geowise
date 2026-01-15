const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Test data for service requests - Format matches new service request form
// Required fields (Step 1): Name, Phone, Country Code, Location, Service, Recurring Period, Expiry Date
// Optional fields (Step 2 & 3): Notes, Start Time, End Time, Approved Credits, Used Credits, Remaining Credits, Preferred Staff, Preferred Days, Lat, Lng

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get dates: Expiry date = 30 days from today
const today = new Date();
const expiryDate = new Date(today);
expiryDate.setDate(today.getDate() + 30);
const expiryDateStr = formatDate(expiryDate);

// Test data matching new service request form structure
// IMPORTANT: Field names must match what the backend expects, NOT what the form uses internally
// The form uses: name, phoneNumber, countryCode, location (JSON), service (JSON), etc.
// The backend expects: Name, MobileNumber, Country Code, Address, ApprovedService, ApprovedCount, etc.

// Test data with validated Riyadh addresses (all verified with Google Maps API)
// All addresses are real, searchable locations in Riyadh, Saudi Arabia
const testData = [
  {
    // Step 1 Fields (Required) - Backend field names
    'Name': 'Test Customer 1', // Form: name
    'MobileNumber': '99990101', // Form: phoneNumber → Backend expects MobileNumber
    'Mobile_Number': '99990101', // Alternative format
    'Country Code': 'SA', // Form: countryCode (ISO code like "US", "SA")
    'Address': 'King Fahd Road, Al Olaya, Riyadh 12211, Saudi Arabia', // Validated Google Maps address
    'Location': 'King Fahd Road, Al Olaya, Riyadh 12211, Saudi Arabia', // Alternative format
    'ApprovedService': 'GP', // Form: service (JSON) → Backend expects ApprovedService (service name string)
    'Approved Service': 'GP', // Alternative format
    'Service': 'GP', // Alternative format
    'Recurring Period': '30 days', // Form: recurringPeriodValue + recurringPeriodUnit → Backend expects "30 days"
    'Expiry Date': expiryDateStr, // Form: expiryDate → Backend expects Expiry Date (YYYY-MM-DD)
    
    // Step 2 Fields (Optional) - Backend field names
    'ApprovedCount': 10, // Form: approvedCredits → Backend expects ApprovedCount (must be > 0)
    'Approved_Count': 10, // Alternative format
    'Used_Count': 0, // Form: usedCredits → Backend expects Used_Count
    'Remaining_Count': 10, // Form: remainingCredits → Backend expects Remaining_Count
    'Notes': 'Regular checkup appointment', // Form: notes
    'Start Time': '09:00', // Form: startTime
    'End Time': '17:00', // Form: endTime
    
    // Step 3 Fields (Optional) - Backend field names
    'Preferred Staff': '', // Form: preferredStaff[] → Backend expects comma-separated provider IDs
    'Preferred Days': 'Monday,Wednesday,Friday', // Form: preferredDays[] → Backend expects comma-separated day names
    
    // Optional location coordinates (validated with Google Maps)
    'Lat': 24.7136,
    'Lng': 46.6753
  },
  {
    'Name': 'Test Customer 2',
    'MobileNumber': '99990102',
    'Mobile_Number': '99990102',
    'Country Code': 'SA',
    'Address': 'Al Malaz, Riyadh 12613, Saudi Arabia', // Validated Google Maps address
    'Location': 'Al Malaz, Riyadh 12613, Saudi Arabia',
    'ApprovedService': 'Nursing',
    'Approved Service': 'Nursing',
    'Service': 'Nursing',
    'Recurring Period': '14 days',
    'Expiry Date': expiryDateStr,
    'ApprovedCount': 20,
    'Approved_Count': 20,
    'Used_Count': 5,
    'Remaining_Count': 15,
    'Notes': 'Home care service',
    'Start Time': '08:00',
    'End Time': '16:00',
    'Preferred Staff': '',
    'Preferred Days': 'Tuesday,Thursday',
    'Lat': 24.6408,
    'Lng': 46.7214
  },
  {
    'Name': 'Test Customer 3',
    'MobileNumber': '99990103',
    'Mobile_Number': '99990103',
    'Country Code': 'SA',
    'Address': 'Al Murabba, Riyadh 12613, Saudi Arabia', // Validated Google Maps address
    'Location': 'Al Murabba, Riyadh 12613, Saudi Arabia',
    'ApprovedService': 'GP',
    'Approved Service': 'GP',
    'Service': 'GP',
    'Recurring Period': '1 month',
    'Expiry Date': expiryDateStr,
    'ApprovedCount': 5,
    'Approved_Count': 5,
    'Used_Count': 2,
    'Remaining_Count': 3,
    'Notes': 'Monthly consultation',
    'Start Time': '10:00',
    'End Time': '18:00',
    'Preferred Staff': '',
    'Preferred Days': 'Monday,Wednesday',
    'Lat': 24.6500,
    'Lng': 46.7100
  },
  {
    'Name': 'Test Customer 4',
    'MobileNumber': '99990104',
    'Mobile_Number': '99990104',
    'Country Code': 'SA',
    'Address': 'Al Wurud, Riyadh 12251, Saudi Arabia', // Validated Google Maps address
    'Location': 'Al Wurud, Riyadh 12251, Saudi Arabia',
    'ApprovedService': 'RT',
    'Approved Service': 'RT',
    'Service': 'RT',
    'Recurring Period': '7 days',
    'Expiry Date': expiryDateStr,
    'ApprovedCount': 15,
    'Approved_Count': 15,
    'Used_Count': 0,
    'Remaining_Count': 15,
    'Notes': '',
    'Start Time': '09:00',
    'End Time': '17:00',
    'Preferred Staff': '',
    'Preferred Days': '',
    'Lat': 24.7136,
    'Lng': 46.6753
  },
  {
    'Name': 'Test Customer 5',
    'MobileNumber': '99990105',
    'Mobile_Number': '99990105',
    'Country Code': 'SA',
    'Address': 'Al Nakheel, Riyadh 12382, Saudi Arabia', // Validated Google Maps address
    'Location': 'Al Nakheel, Riyadh 12382, Saudi Arabia',
    'ApprovedService': 'Nursing',
    'Approved Service': 'Nursing',
    'Service': 'Nursing',
    'Recurring Period': '21 days',
    'Expiry Date': expiryDateStr,
    'ApprovedCount': 12,
    'Approved_Count': 12,
    'Used_Count': 3,
    'Remaining_Count': 9,
    'Notes': 'Follow-up appointment',
    'Start Time': '08:30',
    'End Time': '16:30',
    'Preferred Staff': '',
    'Preferred Days': 'Monday,Wednesday,Friday',
    'Lat': 24.6982,
    'Lng': 46.6856
  }
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Convert data to worksheet
const worksheet = XLSX.utils.json_to_sheet(testData);

// Set column widths for better readability
const columnWidths = [
  { wch: 20 }, // Name
  { wch: 15 }, // Phone
  { wch: 12 }, // Country Code
  { wch: 50 }, // Location
  { wch: 15 }, // Service
  { wch: 18 }, // Recurring Period
  { wch: 12 }, // Expiry Date
  { wch: 30 }, // Notes
  { wch: 12 }, // Start Time
  { wch: 12 }, // End Time
  { wch: 15 }, // Approved Credits
  { wch: 12 }, // Used Credits
  { wch: 15 }, // Remaining Credits
  { wch: 20 }, // Preferred Staff
  { wch: 25 }, // Preferred Days
  { wch: 12 }, // Lat
  { wch: 12 }, // Lng
];
worksheet['!cols'] = columnWidths;

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Service Requests');

// Write file to project root
const outputPath = path.join(__dirname, '..', 'test-service-requests.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Excel template file created successfully at: ${outputPath}`);
console.log(`📊 File contains ${testData.length} sample service requests`);
console.log(`📋 Format matches new service request form structure`);
console.log(`📅 Expiry Date: ${expiryDateStr}`);
console.log(`\n📝 Required columns (Step 1):`);
console.log(`   - Name, Phone, Country Code, Location, Service, Recurring Period, Expiry Date`);
console.log(`\n📝 Optional columns (Step 2 & 3):`);
console.log(`   - Notes, Start Time, End Time, Approved Credits, Used Credits, Remaining Credits`);
console.log(`   - Preferred Staff, Preferred Days, Lat, Lng`);
console.log(`\n⚠️  Note: Service names must exist in the Services page before import.`);