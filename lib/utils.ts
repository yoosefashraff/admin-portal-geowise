import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MonthGroup } from "./types/scheduler.types";
import { count } from "console";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse .NET JSON date format: /Date(1767286230733)/
 * Returns a Date object or null if parsing fails
 */
export function parseDotNetDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Handle .NET JSON date format: /Date(milliseconds)/
  const dotNetDateMatch = dateString.match(/\/Date\((-?\d+)\)\//);
  if (dotNetDateMatch) {
    const milliseconds = parseInt(dotNetDateMatch[1], 10);
    return new Date(milliseconds);
  }
  
  // Try standard ISO format or other formats
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

export function groupDatesByMonthArray(dates: string[]): MonthGroup[] {
  const grouped: Record<string, MonthGroup> = {};
  
  dates.forEach(date => {
    const monthKey = date.substring(0, 7);
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        month: monthKey,
        dates: []
      };
    }
    
    grouped[monthKey].dates.push(date);
  });
  
  return Object.values(grouped);
}

const countryCallingCodes: Record<string, string> = {
  'AF': '+93', 'AL': '+355', 'DZ': '+213', 'AS': '+1-684', 'AD': '+376',
  'AO': '+244', 'AI': '+1-264', 'AQ': '+672', 'AG': '+1-268', 'AR': '+54',
  'AM': '+374', 'AW': '+297', 'AU': '+61', 'AT': '+43', 'AZ': '+994',
  'BS': '+1-242', 'BH': '+973', 'BD': '+880', 'BB': '+1-246', 'BY': '+375',
  'BE': '+32', 'BZ': '+501', 'BJ': '+229', 'BM': '+1-441', 'BT': '+975',
  'BO': '+591', 'BA': '+387', 'BW': '+267', 'BR': '+55', 'BN': '+673',
  'BG': '+359', 'BF': '+226', 'BI': '+257', 'KH': '+855', 'CM': '+237',
  'CA': '+1', 'CV': '+238', 'KY': '+1-345', 'CF': '+236', 'TD': '+235',
  'CL': '+56', 'CN': '+86', 'CO': '+57', 'KM': '+269', 'CG': '+242',
  'CD': '+243', 'CK': '+682', 'CR': '+506', 'CI': '+225', 'HR': '+385',
  'CU': '+53', 'CY': '+357', 'CZ': '+420', 'DK': '+45', 'DJ': '+253',
  'DM': '+1-767', 'DO': '+1-809', 'EC': '+593', 'EG': '+20', 'SV': '+503',
  'GQ': '+240', 'ER': '+291', 'EE': '+372', 'ET': '+251', 'FJ': '+679',
  'FI': '+358', 'FR': '+33', 'GA': '+241', 'GM': '+220', 'GE': '+995',
  'DE': '+49', 'GH': '+233', 'GR': '+30', 'GD': '+1-473', 'GU': '+1-671',
  'GT': '+502', 'GN': '+224', 'GW': '+245', 'GY': '+592', 'HT': '+509',
  'HN': '+504', 'HK': '+852', 'HU': '+36', 'IS': '+354', 'IN': '+91',
  'ID': '+62', 'IR': '+98', 'IQ': '+964', 'IE': '+353', 'IL': '+972',
  'IT': '+39', 'JM': '+1-876', 'JP': '+81', 'JO': '+962', 'KZ': '+7',
  'KE': '+254', 'KI': '+686', 'KP': '+850', 'KR': '+82', 'KW': '+965',
  'KG': '+996', 'LA': '+856', 'LV': '+371', 'LB': '+961', 'LS': '+266',
  'LR': '+231', 'LY': '+218', 'LI': '+423', 'LT': '+370', 'LU': '+352',
  'MO': '+853', 'MK': '+389', 'MG': '+261', 'MW': '+265', 'MY': '+60',
  'MV': '+960', 'ML': '+223', 'MT': '+356', 'MH': '+692', 'MR': '+222',
  'MU': '+230', 'MX': '+52', 'FM': '+691', 'MD': '+373', 'MC': '+377',
  'MN': '+976', 'ME': '+382', 'MA': '+212', 'MZ': '+258', 'MM': '+95',
  'NA': '+264', 'NR': '+674', 'NP': '+977', 'NL': '+31', 'NZ': '+64',
  'NI': '+505', 'NE': '+227', 'NG': '+234', 'NO': '+47', 'OM': '+968',
  'PK': '+92', 'PW': '+680', 'PS': '+970', 'PA': '+507', 'PG': '+675',
  'PY': '+595', 'PE': '+51', 'PH': '+63', 'PL': '+48', 'PT': '+351',
  'PR': '+1-787', 'QA': '+974', 'RO': '+40', 'RU': '+7', 'RW': '+250',
  'KN': '+1-869', 'LC': '+1-758', 'VC': '+1-784', 'WS': '+685', 'SM': '+378',
  'ST': '+239', 'SA': '+966', 'SN': '+221', 'RS': '+381', 'SC': '+248',
  'SL': '+232', 'SG': '+65', 'SK': '+421', 'SI': '+386', 'SB': '+677',
  'SO': '+252', 'ZA': '+27', 'SS': '+211', 'ES': '+34', 'LK': '+94',
  'SD': '+249', 'SR': '+597', 'SZ': '+268', 'SE': '+46', 'CH': '+41',
  'SY': '+963', 'TW': '+886', 'TJ': '+992', 'TZ': '+255', 'TH': '+66',
  'TL': '+670', 'TG': '+228', 'TO': '+676', 'TT': '+1-868', 'TN': '+216',
  'TR': '+90', 'TM': '+993', 'TV': '+688', 'UG': '+256', 'UA': '+380',
  'AE': '+971', 'GB': '+44', 'US': '+1', 'UY': '+598', 'UZ': '+998',
  'VU': '+678', 'VA': '+379', 'VE': '+58', 'VN': '+84', 'YE': '+967',
  'ZM': '+260', 'ZW': '+263'
};

export function getCallingCode(countryCode: string){
  return countryCallingCodes[countryCode] || '+1';
};

export function allCallingCountries() {
  return Object.keys(countryCallingCodes);
}

// Country code to country name mapping
const countryNames: Record<string, string> = {
  'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 'AU': 'Australia',
  'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
  'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria', 'SE': 'Sweden', 'NO': 'Norway',
  'DK': 'Denmark', 'FI': 'Finland', 'PL': 'Poland', 'PT': 'Portugal', 'GR': 'Greece',
  'IE': 'Ireland', 'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania',
  'SA': 'Saudi Arabia', 'AE': 'UAE', 'KW': 'Kuwait', 'QA': 'Qatar', 'BH': 'Bahrain',
  'OM': 'Oman', 'JO': 'Jordan', 'LB': 'Lebanon', 'EG': 'Egypt', 'MA': 'Morocco',
  'DZ': 'Algeria', 'TN': 'Tunisia', 'ZA': 'South Africa', 'NG': 'Nigeria', 'KE': 'Kenya',
  'GH': 'Ghana', 'ET': 'Ethiopia', 'TZ': 'Tanzania', 'UG': 'Uganda', 'RW': 'Rwanda',
  'IN': 'India', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka', 'NP': 'Nepal',
  'CN': 'China', 'JP': 'Japan', 'KR': 'South Korea', 'TW': 'Taiwan', 'HK': 'Hong Kong',
  'SG': 'Singapore', 'MY': 'Malaysia', 'TH': 'Thailand', 'ID': 'Indonesia', 'PH': 'Philippines',
  'VN': 'Vietnam', 'MM': 'Myanmar', 'KH': 'Cambodia', 'LA': 'Laos', 'BN': 'Brunei',
  'MX': 'Mexico', 'BR': 'Brazil', 'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia',
  'PE': 'Peru', 'VE': 'Venezuela', 'EC': 'Ecuador', 'UY': 'Uruguay', 'PY': 'Paraguay',
  'BO': 'Bolivia', 'CR': 'Costa Rica', 'PA': 'Panama', 'GT': 'Guatemala', 'HN': 'Honduras',
  'NI': 'Nicaragua', 'SV': 'El Salvador', 'DO': 'Dominican Republic', 'CU': 'Cuba',
  'JM': 'Jamaica', 'TT': 'Trinidad and Tobago', 'NZ': 'New Zealand', 'FJ': 'Fiji',
  'PG': 'Papua New Guinea', 'RU': 'Russia', 'UA': 'Ukraine', 'KZ': 'Kazakhstan',
  'BY': 'Belarus', 'UZ': 'Uzbekistan', 'GE': 'Georgia', 'AM': 'Armenia', 'AZ': 'Azerbaijan',
  'TR': 'Turkey', 'IL': 'Israel', 'IR': 'Iran', 'IQ': 'Iraq', 'AF': 'Afghanistan'
};

export function getCountryName(countryCode: string): string {
  return countryNames[countryCode] || countryCode;
}

export function getAllCurrencyCodes() {
  return [
    'USD', 'EUR', 'GBP', 'AED', 'AFN', 'ALL', 'AMD', 'ARS', 'AUD', 'AZN',
    'BAM', 'BDT', 'BGN', 'BHD', 'BIF', 'BND', 'BOB', 'BRL', 'BWP', 'BZD',
    'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CVE', 'CZK', 'DJF',
    'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'GEL', 'GHS', 'GNF', 'GTQ',
    'HKD', 'HNL', 'HRK', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK',
    'JMD', 'JOD', 'JPY', 'KES', 'KHR', 'KMF', 'KRW', 'KWD', 'KZT', 'LBP',
    'LKR', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MOP', 'MUR', 'MXN',
    'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NZD', 'OMR', 'PAB', 'PEN',
    'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR',
    'SDG', 'SEK', 'SGD', 'SOS', 'SYP', 'THB', 'TND', 'TOP', 'TRY', 'TTD',
    'TWD', 'TZS', 'UAH', 'UGX', 'UYU', 'UZS', 'VEF', 'VND', 'XAF', 'XOF',
    'YER', 'ZAR', 'ZWL'
  ];
}


export function metersToMiles(meters : number | null) {
  return meters ? (meters / 1609.34) : null;
}

function isPointInsidePolygon(point : {lng: number, lat: number}, polygon : {lat: number, lng: number}[]) {
    let x = point.lng;
    let y = point.lat;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i].lng;
        let yi = polygon[i].lat;
        let xj = polygon[j].lng;
        let yj = polygon[j].lat;

        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

export function checkInsideZone(zonesJson: string[], clientLocation: {lng: number, lat: number}) : boolean {
    if (!zonesJson || zonesJson.length === 0) {
        return false;
    }
    var isInsideZone = false;

    const barberZonesConverted = zonesJson.map(zoneJson => {
      const zone = JSON.parse(zoneJson);
      const allHaveP = Array.isArray(zone) && zone.every(point => point && point.P);

      if (!allHaveP) {
          console.log("Zone data is invalid: one or more points are missing the 'P' property.");
          return;
      }
      const points = zone.map(point => {
          const [lat, lng] = point.P.split(',');
          return { lat: parseFloat(lat), lng: parseFloat(lng) };
      });

      const isInside = isPointInsidePolygon(clientLocation, points);

      if (isInside) {
          isInsideZone = true;
      }

      return points;
  });
  
  return isInsideZone;
}

export function priceTypeToCurrencyCode(priceType?: string): string {
  if (!priceType) return "USD";

  const normalized = priceType.replace(/\s/g, "");

  const currencyCodes = [
    "USD","EUR","SAR","VND","JPY","KRW","CNY","THB","IDR","MYR",
    "SGD","AUD","CAD","NZD","GBP","CHF","SEK","NOK","DKK","RUB",
    "INR","PKR","BDT","AED","QAR","KWD","OMR","BHD","EGP","ZAR",
    "NGN","KES","GHS","BRL","ARS","CLP","MXN","COP","PEN",
    "PLN","CZK","HUF","RON","TRY","ILS","UAH","MAD","TND",
  ];

  for (const code of currencyCodes) {
    try {
      const formatted = new Intl.NumberFormat("ar", {
        style: "currency",
        currency: code,
      }).format(1);

      const symbol = formatted.replace(/[0-9.,\s]/g, "");

      if (symbol === normalized) {
        return code;
      }
    } catch {
      continue;
    }
  }

  return "USD";
}

export type CurrencyItem = {
  id: number;
  name: string;
  symbol: string;
  currencyCode: string;
};

export function getCurrencies(): CurrencyItem[] {
  return [
    { id: 1, name: "Rest of world", symbol: "$", currencyCode: "USD" },
    { id: 2, name: "Europe (Excluding uk)", symbol: "€", currencyCode: "EUR" },
    { id: 3, name: "UK", symbol: "£", currencyCode: "GBP" },
    { id: 4, name: "United Arab Emirates Dirham", symbol: "د.إ.‏", currencyCode: "AED" },
    { id: 5, name: "Afghan Afghani", symbol: "؋", currencyCode: "AFN" },
    { id: 6, name: "Albanian Lek", symbol: "Lek", currencyCode: "ALL" },
    { id: 7, name: "Armenian Dram", symbol: "դր.", currencyCode: "AMD" },
    { id: 8, name: "Argentine Peso", symbol: "$", currencyCode: "ARS" },
    { id: 9, name: "Australian Dollar", symbol: "$", currencyCode: "AUD" },
    { id: 10, name: "Azerbaijani Manat", symbol: "ман.", currencyCode: "AZN" },
    { id: 11, name: "Bosnia-Herzegovina Convertible Mark", symbol: "KM", currencyCode: "BAM" },
    { id: 12, name: "Bangladeshi Taka", symbol: "৳", currencyCode: "BDT" },
    { id: 13, name: "CFA Franc BCEAO", symbol: "CFA", currencyCode: "XOF" },
    { id: 14, name: "Bulgarian Lev", symbol: "лв.", currencyCode: "BGN" },
    { id: 15, name: "Bahraini Dinar", symbol: "د.ب.‏", currencyCode: "BHD" },
    { id: 16, name: "Burundian Franc", symbol: "FBu", currencyCode: "BIF" },
    { id: 17, name: "CFA Franc BCEAO", symbol: "CFA", currencyCode: "XOF" },
    { id: 18, name: "Brunei Dollar", symbol: "$", currencyCode: "BND" },
    { id: 19, name: "Bolivian Boliviano", symbol: "Bs", currencyCode: "BOB" },
    { id: 20, name: "Brazilian Real", symbol: "R$", currencyCode: "BRL" },
    { id: 21, name: "Norwegian Krone", symbol: "kr", currencyCode: "NOK" },
    { id: 22, name: "Botswanan Pula", symbol: "P", currencyCode: "BWP" },
    { id: 23, name: "Belize Dollar", symbol: "$", currencyCode: "BZD" },
    { id: 24, name: "Canadian Dollar", symbol: "$", currencyCode: "CAD" },
    { id: 25, name: "Australian Dollar", symbol: "$", currencyCode: "AUD" },
    { id: 26, name: "Congolese Franc", symbol: "FrCD", currencyCode: "CDF" },
    { id: 27, name: "CFA Franc BEAC", symbol: "FCFA", currencyCode: "XAF" },
    { id: 28, name: "CFA Franc BEAC", symbol: "FCFA", currencyCode: "XAF" },
    { id: 29, name: "Swiss Franc", symbol: "CHF", currencyCode: "CHF" },
    { id: 30, name: "CFA Franc BCEAO", symbol: "CFA", currencyCode: "XOF" },
    { id: 31, name: "New Zealand Dollar", symbol: "$", currencyCode: "NZD" },
    { id: 32, name: "Chilean Peso", symbol: "$", currencyCode: "CLP" },
    { id: 33, name: "CFA Franc BEAC", symbol: "FCFA", currencyCode: "XAF" },
    { id: 34, name: "Chinese Yuan", symbol: "CN¥", currencyCode: "CNY" },
    { id: 35, name: "Colombian Peso", symbol: "$", currencyCode: "COP" },
    { id: 36, name: "Costa Rican Colón", symbol: "₡", currencyCode: "CRC" },
    { id: 37, name: "Cape Verdean Escudo", symbol: "CV$", currencyCode: "CVE" },
    { id: 38, name: "Australian Dollar", symbol: "$", currencyCode: "AUD" },
    { id: 39, name: "Czech Republic Koruna", symbol: "Kč", currencyCode: "CZK" },
    { id: 40, name: "Djiboutian Franc", symbol: "Fdj", currencyCode: "DJF" },
    { id: 41, name: "Danish Krone", symbol: "kr", currencyCode: "DKK" },
    { id: 42, name: "Dominican Peso", symbol: "RD$", currencyCode: "DOP" },
    { id: 43, name: "Algerian Dinar", symbol: "د.ج.‏", currencyCode: "DZD" },
    { id: 44, name: "Egyptian Pound", symbol: "ج.م.‏", currencyCode: "EGP" },
    { id: 45, name: "Moroccan Dirham", symbol: "د.م.‏", currencyCode: "MAD" },
    { id: 46, name: "Eritrean Nakfa", symbol: "Nfk", currencyCode: "ERN" },
    { id: 47, name: "Ethiopian Birr", symbol: "Br", currencyCode: "ETB" },
    { id: 48, name: "Danish Krone", symbol: "kr", currencyCode: "DKK" },
    { id: 49, name: "CFA Franc BEAC", symbol: "FCFA", currencyCode: "XAF" },
    { id: 50, name: "Georgian Lari", symbol: "GEL", currencyCode: "GEL" },
    { id: 51, name: "Ghanaian Cedi", symbol: "GH₵", currencyCode: "GHS" },
    { id: 52, name: "Danish Krone", symbol: "kr", currencyCode: "DKK" },
    { id: 53, name: "Guinean Franc", symbol: "FG", currencyCode: "GNF" },
    { id: 54, name: "CFA Franc BEAC", symbol: "FCFA", currencyCode: "XAF" },
    { id: 55, name: "Guatemalan Quetzal", symbol: "Q", currencyCode: "GTQ" },
    { id: 56, name: "CFA Franc BCEAO", symbol: "CFA", currencyCode: "XOF" },
    { id: 57, name: "Hong Kong Dollar", symbol: "$", currencyCode: "HKD" },
    { id: 58, name: "Australian Dollar", symbol: "$", currencyCode: "AUD" },
    { id: 59, name: "Honduran Lempira", symbol: "L", currencyCode: "HNL" },
    { id: 60, name: "Croatian Kuna", symbol: "kn", currencyCode: "HRK" },
    { id: 61, name: "Hungarian Forint", symbol: "Ft", currencyCode: "HUF" },
    { id: 62, name: "Indonesian Rupiah", symbol: "Rp", currencyCode: "IDR" },
    { id: 63, name: "Israeli New Sheqel", symbol: "₪", currencyCode: "ILS" },
    { id: 64, name: "Indian Rupee", symbol: "₹", currencyCode: "INR" },
    { id: 65, name: "Iraqi Dinar", symbol: "د.ع.‏", currencyCode: "IQD" },
    { id: 66, name: "Iranian Rial", symbol: "﷼", currencyCode: "IRR" },
    { id: 67, name: "Icelandic Króna", symbol: "kr", currencyCode: "ISK" },
    { id: 68, name: "Jamaican Dollar", symbol: "$", currencyCode: "JMD" },
    { id: 69, name: "Jordanian Dinar", symbol: "د.أ.‏", currencyCode: "JOD" },
    { id: 70, name: "Japanese Yen", symbol: "¥", currencyCode: "JPY" },
    { id: 71, name: "Kenyan Shilling", symbol: "Ksh", currencyCode: "KES" },
    { id: 72, name: "Cambodian Riel", symbol: "៛", currencyCode: "KHR" },
    { id: 73, name: "Australian Dollar", symbol: "$", currencyCode: "AUD" },
    { id: 74, name: "Comorian Franc", symbol: "FC", currencyCode: "KMF" },
    { id: 75, name: "South Korean Won", symbol: "₩", currencyCode: "KRW" },
    { id: 76, name: "Kuwaiti Dinar", symbol: "د.ك.‏", currencyCode: "KWD" },
    { id: 77, name: "Kazakhstani Tenge", symbol: "тңг.", currencyCode: "KZT" },
    { id: 78, name: "Lebanese Pound", symbol: "ل.ل.‏", currencyCode: "LBP" },
    { id: 79, name: "Swiss Franc", symbol: "CHF", currencyCode: "CHF" },
    { id: 80, name: "Sri Lankan Rupee", symbol: "SL Re", currencyCode: "LKR" },
    { id: 81, name: "Libyan Dinar", symbol: "د.ل.‏", currencyCode: "LYD" },
    { id: 82, name: "Moroccan Dirham", symbol: "د.م.‏", currencyCode: "MAD" },
    { id: 83, name: "Moldovan Leu", symbol: "MDL", currencyCode: "MDL" },
    { id: 84, name: "Malagasy Ariary", symbol: "MGA", currencyCode: "MGA" },
    { id: 85, name: "Macedonian Denar", symbol: "MKD", currencyCode: "MKD" },
    { id: 86, name: "CFA Franc BCEAO", symbol: "CFA", currencyCode: "XOF" },
    { id: 87, name: "Myanma Kyat", symbol: "K", currencyCode: "MMK" },
    { id: 88, name: "Macanese Pataca", symbol: "MOP$", currencyCode: "MOP" },
    { id: 89, name: "Mauritian Rupee", symbol: "MURs", currencyCode: "MUR" },
    { id: 90, name: "Mexican Peso", symbol: "$", currencyCode: "MXN" },
    { id: 91, name: "Malaysian Ringgit", symbol: "RM", currencyCode: "MYR" },
    { id: 92, name: "Mozambican Metical", symbol: "MTn", currencyCode: "MZN" },
    { id: 93, name: "Namibian Dollar", symbol: "N$", currencyCode: "NAD" },
    { id: 94, name: "CFA Franc BCEAO", symbol: "CFA", currencyCode: "XOF" },
    { id: 95, name: "Australian Dollar", symbol: "$", currencyCode: "AUD" },
    { id: 96, name: "Nigerian Naira", symbol: "₦", currencyCode: "NGN" },
    { id: 97, name: "Nicaraguan Córdoba", symbol: "C$", currencyCode: "NIO" },
    { id: 98, name: "Norwegian Krone", symbol: "kr", currencyCode: "NOK" },
    { id: 100, name: "Australian Dollar", symbol: "$", currencyCode: "AUD" },
    { id: 101, name: "New Zealand Dollar", symbol: "$", currencyCode: "NZD" },
    { id: 102, name: "New Zealand Dollar", symbol: "$", currencyCode: "NZD" },
    { id: 103, name: "Omani Rial", symbol: "ر.ع.‏", currencyCode: "OMR" },
    { id: 104, name: "Panamanian Balboa", symbol: "B/.", currencyCode: "PAB" },
    { id: 105, name: "Peruvian Nuevo Sol", symbol: "S/.", currencyCode: "PEN" },
    { id: 106, name: "Philippine Peso", symbol: "₱", currencyCode: "PHP" },
    { id: 107, name: "Pakistani Rupee", symbol: "₨", currencyCode: "PKR" },
    { id: 108, name: "Polish Zloty", symbol: "zł", currencyCode: "PLN" },
    { id: 109, name: "New Zealand Dollar", symbol: "$", currencyCode: "NZD" },
    { id: 110, name: "Israeli New Sheqel", symbol: "₪", currencyCode: "ILS" },
    { id: 111, name: "Paraguayan Guarani", symbol: "₲", currencyCode: "PYG" },
    { id: 112, name: "Qatari Rial", symbol: "ر.ق.‏", currencyCode: "QAR" },
    { id: 113, name: "Romanian Leu", symbol: "RON", currencyCode: "RON" },
    { id: 114, name: "Serbian Dinar", symbol: "дин.", currencyCode: "RSD" },
    { id: 115, name: "Russian Ruble", symbol: "₽", currencyCode: "RUB" },
    { id: 116, name: "Rwandan Franc", symbol: "FR", currencyCode: "RWF" },
    { id: 117, name: "Saudi Riyal", symbol: "ر.س.‏", currencyCode: "SAR" },
    { id: 118, name: "Sudanese Pound", symbol: "SDG", currencyCode: "SDG" },
    { id: 119, name: "Swedish Krona", symbol: "kr", currencyCode: "SEK" },
    { id: 120, name: "Singapore Dollar", symbol: "$", currencyCode: "SGD" },
    { id: 121, name: "Norwegian Krone", symbol: "kr", currencyCode: "NOK" },
    { id: 122, name: "CFA Franc BCEAO", symbol: "CFA", currencyCode: "XOF" },
    { id: 123, name: "Somali Shilling", symbol: "Ssh", currencyCode: "SOS" },
    { id: 124, name: "Syrian Pound", symbol: "ل.س.‏", currencyCode: "SYP" },
    { id: 125, name: "CFA Franc BEAC", symbol: "FCFA", currencyCode: "XAF" },
    { id: 126, name: "CFA Franc BCEAO", symbol: "CFA", currencyCode: "XOF" },
    { id: 127, name: "Thai Baht", symbol: "฿", currencyCode: "THB" },
    { id: 128, name: "New Zealand Dollar", symbol: "$", currencyCode: "NZD" },
    { id: 129, name: "Tunisian Dinar", symbol: "د.ت.‏", currencyCode: "TND" },
    { id: 130, name: "Tongan Paʻanga", symbol: "T$", currencyCode: "TOP" },
    { id: 131, name: "Turkish Lira", symbol: "TL", currencyCode: "TRY" },
    { id: 132, name: "Trinidad and Tobago Dollar", symbol: "$", currencyCode: "TTD" },
    { id: 133, name: "Australian Dollar", symbol: "$", currencyCode: "AUD" },
    { id: 134, name: "New Taiwan Dollar", symbol: "NT$", currencyCode: "TWD" },
    { id: 135, name: "Tanzanian Shilling", symbol: "TSh", currencyCode: "TZS" },
    { id: 136, name: "Ukrainian Hryvnia", symbol: "₴", currencyCode: "UAH" },
    { id: 137, name: "Ugandan Shilling", symbol: "USh", currencyCode: "UGX" },
    { id: 138, name: "Uruguayan Peso", symbol: "$", currencyCode: "UYU" },
    { id: 139, name: "Uzbekistan Som", symbol: "UZS", currencyCode: "UZS" },
    { id: 140, name: "Venezuelan Bolívar", symbol: "Bs.F.", currencyCode: "VEF" },
    { id: 141, name: "Vietnamese Dong", symbol: "₫", currencyCode: "VND" },
    { id: 142, name: "Yemeni Rial", symbol: "ر.ي.‏", currencyCode: "YER" },
    { id: 143, name: "South African Rand", symbol: "R", currencyCode: "ZAR" },
    { id: 144, name: "Zimbabwean Dollar", symbol: "ZWL$", currencyCode: "ZWL" },
    { id: 145, name: "United States", symbol: "$", currencyCode: "USD" },
  ];
}

export function normalizeDistance(distance: string | number){
  if (distance === "Unknown") return 0;
  const value = Number(distance);
  return isNaN(value) ? 0 : value;
};

export function convertTo12Hour (time24 : string){
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

export function convertAspNetDate(dateString: string) {
  const match = dateString.match(/\d+/);
  const timestamp = match ? Number(match[0]) : null;
  const date = timestamp ? dayjs(timestamp) : null;

  return date?.format('MMM DD, YYYY') || '';
}