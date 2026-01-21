"""
News service for fetching current news to provide context for sentiment analysis.
Integrates with NewsAPI to give Sephira AI awareness of current events.
"""

import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class NewsService:
    """Service for fetching current news to provide context for sentiment analysis."""
    
    # Map country names to ISO codes for NewsAPI
    COUNTRY_CODES = {
        "United States": "us",
        "United Kingdom": "gb",
        "Germany": "de",
        "France": "fr",
        "China": "cn",
        "Japan": "jp",
        "India": "in",
        "Brazil": "br",
        "Australia": "au",
        "Canada": "ca",
        "Italy": "it",
        "Spain": "es",
        "Mexico": "mx",
        "South Korea": "kr",
        "Russia": "ru",
        "Netherlands": "nl",
        "Switzerland": "ch",
        "Sweden": "se",
        "Norway": "no",
        "Denmark": "dk",
        "Poland": "pl",
        "Belgium": "be",
        "Austria": "at",
        "Ireland": "ie",
        "Portugal": "pt",
        "Greece": "gr",
        "Turkey": "tr",
        "Israel": "il",
        "Saudi Arabia": "sa",
        "United Arab Emirates": "ae",
        "South Africa": "za",
        "Nigeria": "ng",
        "Egypt": "eg",
        "Argentina": "ar",
        "Colombia": "co",
        "Chile": "cl",
        "Indonesia": "id",
        "Malaysia": "my",
        "Singapore": "sg",
        "Thailand": "th",
        "Philippines": "ph",
        "Vietnam": "vn",
        "New Zealand": "nz",
        "Taiwan": "tw",
        "Hong Kong": "hk"
    }
    
    def __init__(self, api_key: str):
        """Initialize the news service with API key."""
        self.api_key = api_key
        self.base_url = "https://newsapi.org/v2"
        self.cache: Dict[str, Dict] = {}
        self.cache_duration = timedelta(minutes=30)
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid."""
        if cache_key not in self.cache:
            return False
        cached_time = self.cache[cache_key].get("timestamp")
        if not cached_time:
            return False
        return datetime.now() - cached_time < self.cache_duration
    
    def get_news_for_country(self, country: str, limit: int = 5) -> List[Dict]:
        """
        Fetch recent news headlines for a specific country.
        
        Args:
            country: Country name
            limit: Maximum number of articles to fetch
            
        Returns:
            List of news article dictionaries
        """
        cache_key = f"country_{country}"
        
        # Return cached data if valid
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key].get("data", [])
        
        try:
            country_code = self.COUNTRY_CODES.get(country)
            
            if not country_code:
                # Try searching by country name instead
                return self.search_news(country, limit)
            
            response = requests.get(
                f"{self.base_url}/top-headlines",
                params={
                    "country": country_code,
                    "apiKey": self.api_key,
                    "pageSize": limit
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get("articles", [])
                news = [
                    {
                        "title": a.get("title", ""),
                        "description": a.get("description", ""),
                        "source": a.get("source", {}).get("name", ""),
                        "published": a.get("publishedAt", ""),
                        "url": a.get("url", "")
                    }
                    for a in articles
                    if a.get("title")  # Filter out articles without titles
                ]
                
                # Cache the results
                self.cache[cache_key] = {
                    "data": news,
                    "timestamp": datetime.now()
                }
                
                logger.info(f"Fetched {len(news)} news articles for {country}")
                return news
            else:
                logger.warning(f"News API returned {response.status_code} for {country}")
                return []
                
        except requests.Timeout:
            logger.error(f"Timeout fetching news for {country}")
            return []
        except Exception as e:
            logger.error(f"Error fetching news for {country}: {e}")
            return []
    
    def search_news(self, query: str, limit: int = 5) -> List[Dict]:
        """
        Search for news articles by keyword/topic.
        
        Args:
            query: Search query
            limit: Maximum number of articles
            
        Returns:
            List of news article dictionaries
        """
        cache_key = f"search_{query}"
        
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key].get("data", [])
        
        try:
            response = requests.get(
                f"{self.base_url}/everything",
                params={
                    "q": query,
                    "apiKey": self.api_key,
                    "pageSize": limit,
                    "sortBy": "publishedAt",
                    "language": "en"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get("articles", [])
                news = [
                    {
                        "title": a.get("title", ""),
                        "description": a.get("description", ""),
                        "source": a.get("source", {}).get("name", ""),
                        "published": a.get("publishedAt", ""),
                        "url": a.get("url", "")
                    }
                    for a in articles
                    if a.get("title")
                ]
                
                self.cache[cache_key] = {
                    "data": news,
                    "timestamp": datetime.now()
                }
                
                logger.info(f"Found {len(news)} news articles for query: {query}")
                return news
            else:
                logger.warning(f"News search returned {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error searching news for '{query}': {e}")
            return []
    
    def get_news_summary(self, countries: List[str], include_global: bool = True) -> str:
        """
        Get a formatted news summary for multiple countries.
        
        Args:
            countries: List of country names
            include_global: Whether to include global/world news
            
        Returns:
            Formatted string with news summaries
        """
        summaries = []
        
        # Fetch news for each country (limit to 3 to avoid token bloat)
        for country in countries[:3]:
            news = self.get_news_for_country(country, limit=3)
            if news:
                country_news = f"\n📍 {country} - Recent Headlines:\n"
                for article in news:
                    title = article['title']
                    source = article['source']
                    # Truncate long titles
                    if len(title) > 100:
                        title = title[:97] + "..."
                    country_news += f"  • {title} ({source})\n"
                summaries.append(country_news)
        
        # Add global news if requested and we have room
        if include_global and len(countries) < 3:
            global_news = self.search_news("world economy politics", limit=3)
            if global_news:
                global_summary = "\n🌍 Global Headlines:\n"
                for article in global_news:
                    title = article['title']
                    source = article['source']
                    if len(title) > 100:
                        title = title[:97] + "..."
                    global_summary += f"  • {title} ({source})\n"
                summaries.append(global_summary)
        
        if summaries:
            return "\n\n--- CURRENT NEWS CONTEXT (for correlation with sentiment data) ---" + "".join(summaries)
        
        return ""
    
    def get_news_for_topic(self, topic: str, limit: int = 5) -> str:
        """
        Get news related to a specific topic and format it.
        
        Args:
            topic: Topic to search for
            limit: Number of articles
            
        Returns:
            Formatted news string
        """
        news = self.search_news(topic, limit)
        
        if not news:
            return ""
        
        summary = f"\n\n--- NEWS RELATED TO '{topic.upper()}' ---\n"
        for article in news:
            title = article['title']
            source = article['source']
            if len(title) > 100:
                title = title[:97] + "..."
            summary += f"  • {title} ({source})\n"
        
        return summary
