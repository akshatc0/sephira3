import re
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)


class QueryParser:
    
    def __init__(self, available_countries: List[str], date_range: Tuple[str, str]):
        self.available_countries = available_countries
        self.date_range = date_range
        self.start_date, self.end_date = date_range
        
        # Create country mapping for fuzzy matching
        self.country_map = {}
        for country in available_countries:
            self.country_map[country.lower()] = country
            self.country_map[country.lower().replace(' ', '')] = country
    
    def extract_countries(self, query: str) -> List[str]:
        query_lower = query.lower()
        mentioned = []
        
        # Use word boundaries to avoid partial matches
        for country in self.available_countries:
            country_lower = country.lower()
            pattern = r'\b' + re.escape(country_lower) + r'\b'
            if re.search(pattern, query_lower):
                if country not in mentioned:
                    mentioned.append(country)
        
        return mentioned
    
    def extract_date_range(self, query: str) -> Tuple[Optional[str], Optional[str]]:
        query_lower = query.lower()
        start_date = None
        end_date = None
        
        # Parse explicit dates (YYYY-MM-DD or YYYY/MM/DD)
        date_pattern = r'\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b'
        dates = re.findall(date_pattern, query)
        if dates:
            try:
                parsed_dates = []
                for year, month, day in dates:
                    parsed_dates.append(datetime(int(year), int(month), int(day)))
                if len(parsed_dates) == 1:
                    # Single date - use as start or end based on context
                    if 'from' in query_lower or 'since' in query_lower:
                        start_date = parsed_dates[0].strftime("%Y-%m-%d")
                    elif 'until' in query_lower or 'to' in query_lower or 'before' in query_lower:
                        end_date = parsed_dates[0].strftime("%Y-%m-%d")
                    else:
                        start_date = parsed_dates[0].strftime("%Y-%m-%d")
                elif len(parsed_dates) >= 2:
                    # Multiple dates - use first as start, last as end
                    parsed_dates.sort()
                    start_date = parsed_dates[0].strftime("%Y-%m-%d")
                    end_date = parsed_dates[-1].strftime("%Y-%m-%d")
            except ValueError:
                pass
        
        # Parse year-only references
        if not dates:
            year_pattern = r'\b(19|20)(\d{2})\b'
            year_matches = list(re.finditer(year_pattern, query))
            if year_matches:
                try:
                    year_values = [int(match.group(1) + match.group(2)) for match in year_matches]
                    if year_values:
                        if 'from' in query_lower or 'since' in query_lower:
                            start_date = f"{min(year_values)}-01-01"
                        elif len(year_values) == 1:
                            # Single year - use as full year range
                            start_date = f"{year_values[0]}-01-01"
                            end_date = f"{year_values[0]}-12-31"
                        else:
                            start_date = f"{min(year_values)}-01-01"
                            end_date = f"{max(year_values)}-12-31"
                except (ValueError, AttributeError):
                    pass
        
        # Parse relative time expressions
        now = datetime.now()
        
        # "last N years/months/days"
        last_pattern = r'last\s+(\d+)\s+(year|years|month|months|day|days)'
        match = re.search(last_pattern, query_lower)
        if match:
            amount = int(match.group(1))
            unit = match.group(2)
            if 'year' in unit:
                start_date = (now - timedelta(days=365 * amount)).strftime("%Y-%m-%d")
            elif 'month' in unit:
                start_date = (now - timedelta(days=30 * amount)).strftime("%Y-%m-%d")
            elif 'day' in unit:
                start_date = (now - timedelta(days=amount)).strftime("%Y-%m-%d")
            end_date = now.strftime("%Y-%m-%d")
        
        past_pattern = r'past\s+(\d+)\s+(year|years|month|months|day|days)'
        match = re.search(past_pattern, query_lower)
        if match:
            amount = int(match.group(1))
            unit = match.group(2)
            if 'year' in unit:
                start_date = (now - timedelta(days=365 * amount)).strftime("%Y-%m-%d")
            elif 'month' in unit:
                start_date = (now - timedelta(days=30 * amount)).strftime("%Y-%m-%d")
            elif 'day' in unit:
                start_date = (now - timedelta(days=amount)).strftime("%Y-%m-%d")
            end_date = now.strftime("%Y-%m-%d")
        
        # "in 2023", "during 2023"
        in_year_pattern = r'(?:in|during)\s+(\d{4})'
        match = re.search(in_year_pattern, query_lower)
        if match and not start_date:
            year = int(match.group(1))
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"
        
        # Validate dates are within available data range
        if start_date:
            if start_date < self.start_date:
                start_date = self.start_date
            if start_date > self.end_date:
                start_date = None
        
        if end_date:
            if end_date > self.end_date:
                end_date = self.end_date
            if end_date < self.start_date:
                end_date = None
        
        return start_date, end_date
    
    def parse_query(self, query: str) -> Dict[str, Any]:
        countries = self.extract_countries(query)
        start_date, end_date = self.extract_date_range(query)
        
        # If no dates found, use full available range
        if not start_date and not end_date:
            start_date = self.start_date
            end_date = self.end_date
        
        return {
            "countries": countries,
            "date_range": {
                "start": start_date,
                "end": end_date
            }
        }
