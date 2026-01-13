const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Test data for service requests - LIMITED CREDITS FOR TESTING
// Each customer has only 1 remaining credit to minimize booking creation
// Format matches backend sample: 5CN_Service_Approvals_Sample_v3 (1).xlsx

// Helper function to get Excel date serial number
function excelDate(date) {
  const excelEpoch = new Date(1899, 11, 30);
  const diff = date - excelEpoch;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Get dates: Start date = today, Expiry date = 7 days from today
const today = new Date();
const expiryDate = new Date(today);
expiryDate.setDate(today.getDate() + 7);
const startDateSerial = excelDate(today);
const expiryDateSerial = excelDate(expiryDate);

// Test data with REALISTIC locations in Riyadh that could be covered by real providers
// These are actual residential/commercial areas in Riyadh, not test-only coordinates
// The dev environment is for testing, but the data should be realistic
// IMPORTANT: Address field is required for proper mapping - backend needs actual address strings
// CRITICAL: Using unique phone numbers (9999xxxxx) and ID numbers (999xxxxxxx) to prevent
// backend from matching to existing customers. Backend matches by phone/ID, so we need
// numbers that don't exist in the system to preserve "Test Customer" names.
const testData = [
  {
    'Mr_no': '99923501',
    'ID number ': '9995465001',
    'Patient_Name': 'Test Customer 1',
    'Approved Service': 'GP',
    'Approved_Count': 10,
    'Used_Count': 9,
    'Remaining_Count': 1,
    'Approval_Start_Date': startDateSerial,
    'Approval_Expiry_Date': expiryDateSerial,
    'Address': '2716 Olaya St, Al Wurud, Riyadh 12251, Saudi Arabia', // Al Olaya district - real address
    'Location': '24.7136,46.6753', // Coordinates for mapping
    'Latitude': 24.7136,
    'Longitude': 46.6753,
    'Country_Code': 966,
    'Mobile_Number': 99990101, // Unique test phone number
    'File_Number': 99960,
    'Insurance_Number': '99923501',
    'Level_of_Care': 'PACT1',
    'Recurring period (Days)': 2
  },
  {
    'Mr_no': '99923502',
    'ID number ': '9995465002',
    'Patient_Name': 'Test Customer 2',
    'Approved Service': 'Nursing',
    'Approved_Count': 10,
    'Used_Count': 9,
    'Remaining_Count': 1,
    'Approval_Start_Date': startDateSerial,
    'Approval_Expiry_Date': expiryDateSerial,
    'Address': 'RMDD8074، 8074 جبل نهير، 2185, Ad Dar Al Baida, Riyadh 14518, Saudi Arabia', // Al Malaz district - real address
    'Location': '24.6877,46.7215', // Coordinates for mapping
    'Latitude': 24.6877,
    'Longitude': 46.7215,
    'Country_Code': 966,
    'Mobile_Number': 99990102, // Unique test phone number
    'File_Number': 99961,
    'Insurance_Number': '99923502',
    'Level_of_Care': 'LTCA',
    'Recurring period (Days)': 2
  },
  {
    'Mr_no': '99923503',
    'ID number ': '9995465003',
    'Patient_Name': 'Test Customer 3',
    'Approved Service': 'GP',
    'Approved_Count': 10,
    'Used_Count': 9,
    'Remaining_Count': 1,
    'Approval_Start_Date': startDateSerial,
    'Approval_Expiry_Date': expiryDateSerial,
    'Address': 'RQJA2976, 2976 No.4, 8167، حي الجزيرة، Riyadh 14261, Saudi Arabia', // Al Muruj district - real address
    'Location': '24.7574,46.6428', // Coordinates for mapping
    'Latitude': 24.7574,
    'Longitude': 46.6428,
    'Country_Code': 966,
    'Mobile_Number': 99990103, // Unique test phone number
    'File_Number': 99962,
    'Insurance_Number': '99923503',
    'Level_of_Care': 'PACT1',
    'Recurring period (Days)': 2
  },
  {
    'Mr_no': '99923504',
    'ID number ': '9995465004',
    'Patient_Name': 'Test Customer 4',
    'Approved Service': 'RT',
    'Approved_Count': 10,
    'Used_Count': 9,
    'Remaining_Count': 1,
    'Approval_Start_Date': startDateSerial,
    'Approval_Expiry_Date': expiryDateSerial,
    'Address': 'RSNB3234, 3234 At Tanukhi, 7111, Ar Rimayah, Riyadh 14816, Saudi Arabia', // Diplomatic Quarter area - real address
    'Location': '24.6833,46.6167', // Coordinates for mapping
    'Latitude': 24.6833,
    'Longitude': 46.6167,
    'Country_Code': 966,
    'Mobile_Number': 99990104, // Unique test phone number
    'File_Number': 99963,
    'Insurance_Number': '99923504',
    'Level_of_Care': 'LTCA',
    'Recurring period (Days)': 2
  },
  {
    'Mr_no': '99923505',
    'ID number ': '9995465005',
    'Patient_Name': 'Test Customer 5',
    'Approved Service': 'Nursing',
    'Approved_Count': 10,
    'Used_Count': 9,
    'Remaining_Count': 1,
    'Approval_Start_Date': startDateSerial,
    'Approval_Expiry_Date': expiryDateSerial,
    'Address': 'PM7G+C4F, Al Olaya, Riyadh 12251, Saudi Arabia', // Al Olaya area - real address
    'Location': '24.6982,46.6856', // Coordinates for mapping
    'Latitude': 24.6982,
    'Longitude': 46.6856,
    'Country_Code': 966,
    'Mobile_Number': 99990105, // Unique test phone number
    'File_Number': 99964,
    'Insurance_Number': '99923505',
    'Level_of_Care': 'PACT1',
    'Recurring period (Days)': 2
  }
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Convert data to worksheet
const worksheet = XLSX.utils.json_to_sheet(testData);

// Set date format for date columns
const dateColumns = ['Approval_Start_Date', 'Approval_Expiry_Date'];
const range = XLSX.utils.decode_range(worksheet['!ref']);
for (let col = 0; col <= range.e.c; col++) {
  const header = XLSX.utils.encode_cell({ r: 0, c: col });
  const headerValue = worksheet[header]?.v;
  if (dateColumns.includes(headerValue)) {
    for (let row = 1; row <= range.e.r; row++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: col });
      if (worksheet[cell]) {
        worksheet[cell].z = 'm/d/yy h:mm'; // Excel date format matching sample
      }
    }
  }
}

// Add worksheet to workbook with same sheet name as sample
XLSX.utils.book_append_sheet(workbook, worksheet, '5CN_Sheet1');

// Write file to project root
const outputPath = path.join(__dirname, '..', 'test-service-requests.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Excel file created successfully at: ${outputPath}`);
console.log(`📊 File contains ${testData.length} test service requests`);
console.log(`📋 Format matches backend sample: 5CN_Service_Approvals_Sample_v3 (1).xlsx`);
console.log(`📅 Dates: Start=${today.toLocaleDateString()}, Expiry=${expiryDate.toLocaleDateString()}`);