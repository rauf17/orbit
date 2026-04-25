export type City = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  timezone: string;
  emoji: string;
  continent: string;
};

export const cities: City[] = [
  // Americas
  { id: "new-york", name: "New York", country: "United States", countryCode: "US", timezone: "America/New_York", emoji: "🇺🇸", continent: "North America" },
  { id: "los-angeles", name: "Los Angeles", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", emoji: "🇺🇸", continent: "North America" },
  { id: "chicago", name: "Chicago", country: "United States", countryCode: "US", timezone: "America/Chicago", emoji: "🇺🇸", continent: "North America" },
  { id: "toronto", name: "Toronto", country: "Canada", countryCode: "CA", timezone: "America/Toronto", emoji: "🇨🇦", continent: "North America" },
  { id: "sao-paulo", name: "São Paulo", country: "Brazil", countryCode: "BR", timezone: "America/Sao_Paulo", emoji: "🇧🇷", continent: "South America" },
  { id: "mexico-city", name: "Mexico City", country: "Mexico", countryCode: "MX", timezone: "America/Mexico_City", emoji: "🇲🇽", continent: "North America" },
  { id: "buenos-aires", name: "Buenos Aires", country: "Argentina", countryCode: "AR", timezone: "America/Argentina/Buenos_Aires", emoji: "🇦🇷", continent: "South America" },
  { id: "vancouver", name: "Vancouver", country: "Canada", countryCode: "CA", timezone: "America/Vancouver", emoji: "🇨🇦", continent: "North America" },
  
  // Europe
  { id: "london", name: "London", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", emoji: "🇬🇧", continent: "Europe" },
  { id: "paris", name: "Paris", country: "France", countryCode: "FR", timezone: "Europe/Paris", emoji: "🇫🇷", continent: "Europe" },
  { id: "berlin", name: "Berlin", country: "Germany", countryCode: "DE", timezone: "Europe/Berlin", emoji: "🇩🇪", continent: "Europe" },
  { id: "madrid", name: "Madrid", country: "Spain", countryCode: "ES", timezone: "Europe/Madrid", emoji: "🇪🇸", continent: "Europe" },
  { id: "amsterdam", name: "Amsterdam", country: "Netherlands", countryCode: "NL", timezone: "Europe/Amsterdam", emoji: "🇳🇱", continent: "Europe" },
  { id: "rome", name: "Rome", country: "Italy", countryCode: "IT", timezone: "Europe/Rome", emoji: "🇮🇹", continent: "Europe" },
  { id: "stockholm", name: "Stockholm", country: "Sweden", countryCode: "SE", timezone: "Europe/Stockholm", emoji: "🇸🇪", continent: "Europe" },
  { id: "warsaw", name: "Warsaw", country: "Poland", countryCode: "PL", timezone: "Europe/Warsaw", emoji: "🇵🇱", continent: "Europe" },
  { id: "istanbul", name: "Istanbul", country: "Turkey", countryCode: "TR", timezone: "Europe/Istanbul", emoji: "🇹🇷", continent: "Europe" },
  { id: "lisbon", name: "Lisbon", country: "Portugal", countryCode: "PT", timezone: "Europe/Lisbon", emoji: "🇵🇹", continent: "Europe" },
  { id: "vienna", name: "Vienna", country: "Austria", countryCode: "AT", timezone: "Europe/Vienna", emoji: "🇦🇹", continent: "Europe" },
  { id: "zurich", name: "Zurich", country: "Switzerland", countryCode: "CH", timezone: "Europe/Zurich", emoji: "🇨🇭", continent: "Europe" },
  
  // Middle East
  { id: "dubai", name: "Dubai", country: "United Arab Emirates", countryCode: "AE", timezone: "Asia/Dubai", emoji: "🇦🇪", continent: "Asia" },
  { id: "riyadh", name: "Riyadh", country: "Saudi Arabia", countryCode: "SA", timezone: "Asia/Riyadh", emoji: "🇸🇦", continent: "Asia" },
  { id: "tel-aviv", name: "Tel Aviv", country: "Israel", countryCode: "IL", timezone: "Asia/Jerusalem", emoji: "🇮🇱", continent: "Asia" },
  { id: "doha", name: "Doha", country: "Qatar", countryCode: "QA", timezone: "Asia/Qatar", emoji: "🇶🇦", continent: "Asia" },
  { id: "kuwait-city", name: "Kuwait City", country: "Kuwait", countryCode: "KW", timezone: "Asia/Kuwait", emoji: "🇰🇼", continent: "Asia" },
  { id: "muscat", name: "Muscat", country: "Oman", countryCode: "OM", timezone: "Asia/Muscat", emoji: "🇴🇲", continent: "Asia" },
  
  // South Asia
  { id: "karachi", name: "Karachi", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi", emoji: "🇵🇰", continent: "Asia" },
  { id: "islamabad", name: "Islamabad", country: "Pakistan", countryCode: "PK", timezone: "Asia/Karachi", emoji: "🇵🇰", continent: "Asia" },
  { id: "mumbai", name: "Mumbai", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", emoji: "🇮🇳", continent: "Asia" },
  { id: "delhi", name: "Delhi", country: "India", countryCode: "IN", timezone: "Asia/Kolkata", emoji: "🇮🇳", continent: "Asia" },
  { id: "dhaka", name: "Dhaka", country: "Bangladesh", countryCode: "BD", timezone: "Asia/Dhaka", emoji: "🇧🇩", continent: "Asia" },
  { id: "colombo", name: "Colombo", country: "Sri Lanka", countryCode: "LK", timezone: "Asia/Colombo", emoji: "🇱🇰", continent: "Asia" },
  { id: "kathmandu", name: "Kathmandu", country: "Nepal", countryCode: "NP", timezone: "Asia/Kathmandu", emoji: "🇳🇵", continent: "Asia" },
  
  // East Asia
  { id: "tokyo", name: "Tokyo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", emoji: "🇯🇵", continent: "Asia" },
  { id: "beijing", name: "Beijing", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", emoji: "🇨🇳", continent: "Asia" },
  { id: "shanghai", name: "Shanghai", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", emoji: "🇨🇳", continent: "Asia" },
  { id: "seoul", name: "Seoul", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul", emoji: "🇰🇷", continent: "Asia" },
  { id: "singapore", name: "Singapore", country: "Singapore", countryCode: "SG", timezone: "Asia/Singapore", emoji: "🇸🇬", continent: "Asia" },
  { id: "hong-kong", name: "Hong Kong", country: "Hong Kong", countryCode: "HK", timezone: "Asia/Hong_Kong", emoji: "🇭🇰", continent: "Asia" },
  { id: "taipei", name: "Taipei", country: "Taiwan", countryCode: "TW", timezone: "Asia/Taipei", emoji: "🇹🇼", continent: "Asia" },
  { id: "osaka", name: "Osaka", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", emoji: "🇯🇵", continent: "Asia" },
  
  // Southeast Asia
  { id: "bangkok", name: "Bangkok", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", emoji: "🇹🇭", continent: "Asia" },
  { id: "jakarta", name: "Jakarta", country: "Indonesia", countryCode: "ID", timezone: "Asia/Jakarta", emoji: "🇮🇩", continent: "Asia" },
  { id: "manila", name: "Manila", country: "Philippines", countryCode: "PH", timezone: "Asia/Manila", emoji: "🇵🇭", continent: "Asia" },
  { id: "kuala-lumpur", name: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", timezone: "Asia/Kuala_Lumpur", emoji: "🇲🇾", continent: "Asia" },
  { id: "ho-chi-minh", name: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", timezone: "Asia/Ho_Chi_Minh", emoji: "🇻🇳", continent: "Asia" },
  
  // Oceania
  { id: "sydney", name: "Sydney", country: "Australia", countryCode: "AU", timezone: "Australia/Sydney", emoji: "🇦🇺", continent: "Oceania" },
  { id: "melbourne", name: "Melbourne", country: "Australia", countryCode: "AU", timezone: "Australia/Melbourne", emoji: "🇦🇺", continent: "Oceania" },
  { id: "auckland", name: "Auckland", country: "New Zealand", countryCode: "NZ", timezone: "Pacific/Auckland", emoji: "🇳🇿", continent: "Oceania" },
  { id: "perth", name: "Perth", country: "Australia", countryCode: "AU", timezone: "Australia/Perth", emoji: "🇦🇺", continent: "Oceania" },
  
  // Africa
  { id: "cairo", name: "Cairo", country: "Egypt", countryCode: "EG", timezone: "Africa/Cairo", emoji: "🇪🇬", continent: "Africa" },
  { id: "lagos", name: "Lagos", country: "Nigeria", countryCode: "NG", timezone: "Africa/Lagos", emoji: "🇳🇬", continent: "Africa" },
  { id: "nairobi", name: "Nairobi", country: "Kenya", countryCode: "KE", timezone: "Africa/Nairobi", emoji: "🇰🇪", continent: "Africa" },
  { id: "johannesburg", name: "Johannesburg", country: "South Africa", countryCode: "ZA", timezone: "Africa/Johannesburg", emoji: "🇿🇦", continent: "Africa" },
  { id: "casablanca", name: "Casablanca", country: "Morocco", countryCode: "MA", timezone: "Africa/Casablanca", emoji: "🇲🇦", continent: "Africa" },
  { id: "accra", name: "Accra", country: "Ghana", countryCode: "GH", timezone: "Africa/Accra", emoji: "🇬🇭", continent: "Africa" }
];
