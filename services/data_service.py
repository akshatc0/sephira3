import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class DataService:
    
    def __init__(self, csv_path: Path):
        self.csv_path = csv_path
        self.df: Optional[pd.DataFrame] = None
        self.countries: List[str] = []
        self.date_range: Tuple[str, str] = ("", "")
        
        self._load_data()
    
    def _load_data(self):
        try:
            logger.info(f"Loading data from {self.csv_path}")
            self.df = pd.read_csv(self.csv_path)
            
            if 'date' in self.df.columns:
                self.df['date'] = pd.to_datetime(self.df['date'])
            
            # Exclude index and date columns to get country list
            exclude_cols = ['Unnamed: 0', 'date']
            self.countries = [col for col in self.df.columns if col not in exclude_cols]
            
            if 'date' in self.df.columns and not self.df['date'].isna().all():
                min_date = self.df['date'].min()
                max_date = self.df['date'].max()
                self.date_range = (
                    min_date.strftime("%Y-%m-%d"),
                    max_date.strftime("%Y-%m-%d")
                )
            
            logger.info(f"Loaded data: {len(self.df)} rows, {len(self.countries)} countries")
            logger.info(f"Date range: {self.date_range[0]} to {self.date_range[1]}")
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def get_countries(self) -> List[str]:
        return self.countries.copy()
    
    def get_date_range(self) -> Tuple[str, str]:
        return self.date_range
    
    def get_country_data(self, country: str, start_date: Optional[str] = None,
                        end_date: Optional[str] = None) -> pd.DataFrame:
        if country not in self.countries:
            raise ValueError(f"Country '{country}' not found in dataset")
        
        if self.df is None:
            raise RuntimeError("Data not loaded")
        
        result_df = self.df[['date', country]].copy()
        result_df = result_df.rename(columns={country: 'sentiment'})
        
        if start_date:
            start_dt = pd.to_datetime(start_date)
            result_df = result_df[result_df['date'] >= start_dt]
        
        if end_date:
            end_dt = pd.to_datetime(end_date)
            result_df = result_df[result_df['date'] <= end_dt]
        
        result_df = result_df.dropna(subset=['sentiment'])
        
        return result_df.sort_values('date')
    
    def get_multiple_countries_data(self, countries: List[str],
                                   start_date: Optional[str] = None,
                                   end_date: Optional[str] = None) -> pd.DataFrame:
        if self.df is None:
            raise RuntimeError("Data not loaded")
        
        for country in countries:
            if country not in self.countries:
                raise ValueError(f"Country '{country}' not found in dataset")
        
        cols = ['date'] + countries
        result_df = self.df[cols].copy()
        
        if start_date:
            start_dt = pd.to_datetime(start_date)
            result_df = result_df[result_df['date'] >= start_dt]
        
        if end_date:
            end_dt = pd.to_datetime(end_date)
            result_df = result_df[result_df['date'] <= end_dt]
        
        country_cols = [c for c in countries if c in result_df.columns]
        result_df = result_df.dropna(subset=country_cols, how='all')
        
        return result_df.sort_values('date')
    
    def get_summary_statistics(self, country: str, start_date: Optional[str] = None,
                              end_date: Optional[str] = None) -> Dict[str, Any]:
        data = self.get_country_data(country, start_date, end_date)
        
        if data.empty:
            return {
                "country": country,
                "data_points": 0,
                "mean": None,
                "min": None,
                "max": None,
                "trend": None,
                "momentum": None,
                "volatility": None,
                "forecast_direction": None
            }
        
        values = data['sentiment'].dropna()
        
        trend = None
        trend_strength = 0.0
        if len(values) > 1:
            # Use linear regression to calculate trend
            x = np.arange(len(values))
            slope = np.polyfit(x, values.values, 1)[0]
            trend_strength = abs(slope) / values.std() if values.std() > 0 else 0
            
            if slope > 0.01:
                trend = "increasing"
            elif slope < -0.01:
                trend = "decreasing"
            else:
                trend = "stable"
        
        momentum = None
        momentum_value = 0.0
        if len(values) >= 3:
            # Compare last 20% vs previous 20% to calculate momentum
            recent_size = max(1, len(values) // 5)
            recent_mean = values.tail(recent_size).mean()
            previous_mean = values.iloc[-recent_size*2:-recent_size].mean() if len(values) >= recent_size*2 else values.head(recent_size).mean()
            momentum_value = (recent_mean - previous_mean) / previous_mean * 100 if previous_mean != 0 else 0
            
            if abs(momentum_value) < 1:
                momentum = "stable"
            elif momentum_value > 5:
                momentum = "strongly_positive"
            elif momentum_value > 1:
                momentum = "positive"
            elif momentum_value < -5:
                momentum = "strongly_negative"
            else:
                momentum = "negative"
        
        volatility = None
        volatility_value = 0.0
        if len(values) > 1:
            # Calculate coefficient of variation (std relative to mean)
            volatility_value = (values.std() / values.mean() * 100) if values.mean() != 0 else 0
            
            if volatility_value < 5:
                volatility = "low"
            elif volatility_value < 15:
                volatility = "moderate"
            else:
                volatility = "high"
        
        forecast_direction = None
        if trend and momentum:
            if trend == "increasing" and momentum in ["positive", "strongly_positive"]:
                forecast_direction = "likely_continuing_upward"
            elif trend == "decreasing" and momentum in ["negative", "strongly_negative"]:
                forecast_direction = "likely_continuing_downward"
            elif trend == "increasing" and momentum in ["negative", "strongly_negative"]:
                forecast_direction = "possible_reversal_downward"
            elif trend == "decreasing" and momentum in ["positive", "strongly_positive"]:
                forecast_direction = "possible_reversal_upward"
            elif momentum == "stable":
                forecast_direction = "likely_stable"
            else:
                forecast_direction = "uncertain"
        
        return {
            "country": country,
            "data_points": len(values),
            "mean": float(values.mean()) if not values.empty else None,
            "min": float(values.min()) if not values.empty else None,
            "max": float(values.max()) if not values.empty else None,
            "std": float(values.std()) if not values.empty else None,
            "trend": trend,
            "trend_strength": float(trend_strength),
            "momentum": momentum,
            "momentum_value": float(momentum_value),
            "volatility": volatility,
            "volatility_value": float(volatility_value),
            "forecast_direction": forecast_direction
        }
    
    def get_data_summary(self, countries: List[str], start_date: Optional[str] = None,
                        end_date: Optional[str] = None) -> str:
        summaries = []
        
        for country in countries:
            stats = self.get_summary_statistics(country, start_date, end_date)
            
            if stats["data_points"] == 0:
                summary = f"{country}: No data available for this period"
            else:
                data = self.get_country_data(country, start_date, end_date)
                
                recent_trend = "stable"
                if len(data) > 10:
                    # Compare last 25% vs first 25% to detect recent trend
                    quarter_size = len(data) // 4
                    recent_mean = data.tail(quarter_size)['sentiment'].mean()
                    early_mean = data.head(quarter_size)['sentiment'].mean()
                    if recent_mean > early_mean * 1.05:
                        recent_trend = "improving"
                    elif recent_mean < early_mean * 0.95:
                        recent_trend = "declining"
                
                latest_value = None
                latest_date = None
                if not data.empty:
                    latest_row = data.iloc[-1]
                    latest_value = latest_row['sentiment']
                    latest_date = latest_row['date'].strftime("%Y-%m-%d")
                
                cyclical_info = ""
                if len(data) >= 12:
                    # Check for annual seasonality patterns
                    data_with_month = data.copy()
                    data_with_month['month'] = data_with_month['date'].dt.month
                    monthly_avg = data_with_month.groupby('month')['sentiment'].mean()
                    
                    # Only flag as seasonal if variation is significant
                    if monthly_avg.std() > data['sentiment'].std() * 0.3:
                        peak_month = monthly_avg.idxmax()
                        low_month = monthly_avg.idxmin()
                        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                        cyclical_info = f"  - Seasonal pattern detected: Peak in {month_names[peak_month-1]}, low in {month_names[low_month-1]}\n"
                
                summary = f"{country}:\n"
                summary += f"  - Data points: {stats['data_points']}\n"
                summary += f"  - Average sentiment: {stats['mean']:.2f}\n"
                summary += f"  - Range: {stats['min']:.2f} to {stats['max']:.2f}\n"
                summary += f"  - Standard deviation: {stats.get('std', 0):.2f}\n"
                summary += f"  - Overall trend: {stats['trend']} (strength: {stats.get('trend_strength', 0):.3f})\n"
                summary += f"  - Recent trend: {recent_trend}\n"
                if stats.get('momentum'):
                    momentum_desc = f"{stats['momentum']} ({stats.get('momentum_value', 0):+.1f}%)"
                    summary += f"  - Momentum: {momentum_desc}\n"
                if stats.get('volatility'):
                    summary += f"  - Volatility: {stats['volatility']} ({stats.get('volatility_value', 0):.1f}%)\n"
                if stats.get('forecast_direction'):
                    summary += f"  - Forecast direction: {stats['forecast_direction']}\n"
                if latest_value is not None:
                    summary += f"  - Latest value ({latest_date}): {latest_value:.2f}\n"
                
                # Add projected next value based on trend extrapolation
                if stats.get('forecast_direction'):
                    if stats['forecast_direction'] == "likely_continuing_upward":
                        if len(data) >= 2:
                            recent_slope = (data.iloc[-1]['sentiment'] - data.iloc[-2]['sentiment'])
                            estimated_next = latest_value + recent_slope
                            summary += f"  - Projected next value (based on recent trend): ~{estimated_next:.2f}\n"
                    elif stats['forecast_direction'] == "likely_continuing_downward":
                        if len(data) >= 2:
                            recent_slope = (data.iloc[-1]['sentiment'] - data.iloc[-2]['sentiment'])
                            estimated_next = latest_value + recent_slope
                            summary += f"  - Projected next value (based on recent trend): ~{estimated_next:.2f}\n"
                
                if cyclical_info:
                    summary += cyclical_info
                
                if start_date and end_date:
                    period_data = data[(data['date'] >= pd.to_datetime(start_date)) & 
                                      (data['date'] <= pd.to_datetime(end_date))]
                    if not period_data.empty:
                        period_mean = period_data['sentiment'].mean()
                        summary += f"  - Period average ({start_date} to {end_date}): {period_mean:.2f}\n"
            
            summaries.append(summary)
        
        date_info = ""
        if start_date and end_date:
            date_info = f"Analysis Period: {start_date} to {end_date}\n\n"
        elif start_date:
            date_info = f"Analysis from: {start_date}\n\n"
        elif end_date:
            date_info = f"Analysis until: {end_date}\n\n"
        
        return date_info + "\n".join(summaries)
    
    def get_detailed_analysis(self, countries: List[str], start_date: Optional[str] = None,
                             end_date: Optional[str] = None) -> Dict[str, Any]:
        analysis = {
            "countries": countries,
            "date_range": {"start": start_date, "end": end_date},
            "country_data": {}
        }
        
        for country in countries:
            data = self.get_country_data(country, start_date, end_date)
            stats = self.get_summary_statistics(country, start_date, end_date)
            
            country_analysis = {
                "statistics": stats,
                "recent_values": [],
                "notable_changes": []
            }
            
            if not data.empty:
                # Get last 5 data points
                recent = data.tail(5)
                country_analysis["recent_values"] = [
                    {
                        "date": row['date'].strftime("%Y-%m-%d"),
                        "sentiment": float(row['sentiment'])
                    }
                    for _, row in recent.iterrows()
                ]
                
                # Detect notable changes (significant jumps/drops > 10%)
                if len(data) > 1:
                    data_sorted = data.sort_values('date')
                    prev_value = None
                    for _, row in data_sorted.iterrows():
                        current_value = row['sentiment']
                        if prev_value is not None:
                            change_pct = abs((current_value - prev_value) / prev_value * 100) if prev_value != 0 else 0
                            if change_pct > 10:
                                country_analysis["notable_changes"].append({
                                    "date": row['date'].strftime("%Y-%m-%d"),
                                    "change": float(current_value - prev_value),
                                    "change_pct": float(change_pct),
                                    "direction": "increase" if current_value > prev_value else "decrease"
                                })
                        prev_value = current_value
            
            analysis["country_data"][country] = country_analysis
        
        return analysis
