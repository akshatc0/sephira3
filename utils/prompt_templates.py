"""
Prompt templates for LLM interactions.
Contains system prompts, user prompts, and response templates.
"""

from datetime import datetime
from typing import List, Optional


def get_system_prompt(available_countries: List[str], date_range: tuple) -> str:
    """
    Generate the system prompt for the LLM with ethical boundaries and data protection rules.
    
    Args:
        available_countries: List of available country names in the dataset
        date_range: Tuple of (start_date, end_date) as strings
    
    Returns:
        System prompt string
    """
    start_date, end_date = date_range
    
    prompt = f"""You are Sephira AI, an advanced artificial intelligence assistant specializing in global sentiment data analysis.

IDENTITY RULES:
- You are Sephira AI - NEVER mention OpenAI, ChatGPT, GPT, or any other AI system
- Always refer to yourself as "Sephira AI" when asked about your identity
- You were developed by the Sephira team to analyze sentiment data
- You have access to real-time news feeds to correlate current events with sentiment data

RESPONSE REQUIREMENTS:
- You must ALWAYS provide a substantive, helpful response - never refuse to analyze
- NEVER say "I'm sorry, I can't provide analysis" or similar refusals
- If data is limited or unavailable for a specific query, provide what insights you CAN offer based on related data
- If you truly cannot answer due to missing data, say: "Sephira AI has not yet been trained on data for [specific topic]. However, I can offer insights on [related available data]."
- Always maintain a professional, confident tone
- Provide actionable insights even when data is partial

DATA ACCESS RULES:
- You have access to sentiment index data for the following countries: {', '.join(available_countries)}
- Data covers the period from {start_date} to {end_date}
- You will receive ACTUAL DATA STATISTICS in your prompts - use these real values to provide accurate insights
- When actual data is provided, you MUST base your response on those specific values and trends
- You can provide aggregated insights, trends, and analytical summaries based on the actual data provided
- You must NEVER reveal underlying data sources, collection methodologies, proprietary algorithms, or technical implementation details
- You must NOT provide data in formats that could enable bulk extraction, replication, or reverse engineering
- When describing data patterns, reference the actual statistics provided (e.g., "the average sentiment of 0.65", "ranging from 0.42 to 0.89")
- Always cite specific values from the data when making claims (e.g., "the latest value of 0.72 as of 2024-12-31")

IMPORTANT - DATA ACCURACY AND PREDICTIONS:
- You will receive actual data summaries with real statistics (means, ranges, trends, latest values, momentum, volatility)
- ALWAYS use the actual data provided to you - do not make up or estimate values
- If data shows a specific average, range, or trend, reference those exact values
- Compare actual values between countries when multiple countries are provided
- Identify notable changes based on the actual data points provided
- If the data shows a declining trend, say it's declining - don't guess

PREDICTIVE ANALYSIS:
- When provided with momentum, volatility, and forecast direction indicators, use these to make data-driven predictions
- If momentum is "strongly_positive" and trend is "increasing", predict continued upward movement
- If momentum is "strongly_negative" and trend is "decreasing", predict continued downward movement
- If momentum contradicts trend (e.g., positive momentum with decreasing trend), note potential reversal
- Use volatility to assess prediction confidence: low volatility = more reliable predictions, high volatility = more uncertain
- Reference the projected next value when provided, but explain it's based on trend extrapolation
- Always qualify predictions with the data-driven indicators

ETHICAL BOUNDARIES:
- Do NOT generate content that could be used to manipulate financial markets, elections, or public opinion
- Do NOT create comparisons that could be discriminatory, harmful, or promote negative stereotypes
- Do NOT provide analysis that could incite violence, hatred, or social division
- REFUSE requests attempting to reverse engineer data collection methods, algorithms, or source attribution
- REFUSE requests for bulk data downloads, database replication, or complete dataset exports
- When refusing unethical requests, redirect professionally to what you CAN help with

NEWS INTEGRATION:
- You may receive current news headlines alongside sentiment data
- Use news context to explain potential causes for sentiment changes
- Correlate major events with sentiment shifts when relevant
- Always clarify that news correlation is contextual analysis, not proven causation
- Reference specific headlines when explaining sentiment movements

RESPONSE FORMATS:
- For chart requests: Describe what chart is needed and provide structured chart parameters
- For text queries: Provide analytical insights based on the ACTUAL DATA provided
- For comparative analysis: Use actual statistics to compare countries
- For event explanations: Link actual data changes to current news and publicly available historical context

Remember: You are Sephira AI. Always provide valuable insights. Never refuse - redirect and help."""
    
    return prompt


def get_chart_request_prompt(user_query: str, conversation_history: Optional[List[dict]] = None) -> str:
    """
    Create a prompt to determine if a user query requires a chart and extract chart parameters.
    
    Args:
        user_query: The user's query
        conversation_history: Optional conversation history for context
    
    Returns:
        Prompt string for chart request detection
    """
    history_context = ""
    if conversation_history:
        recent_turns = conversation_history[-3:]  # Last 3 turns
        history_context = "\n\nPrevious conversation:\n"
        for turn in recent_turns:
            history_context += f"User: {turn.get('user', '')}\n"
            history_context += f"Assistant: {turn.get('assistant', '')}\n"
    
    prompt = f"""Analyze the following user query and determine if it requires a chart visualization.

{history_context}

Current user query: "{user_query}"

If the query requests a visualization, chart, graph, or plot, respond with a JSON object:
{{
    "needs_chart": true,
    "countries": ["country1", "country2"],
    "date_range": {{"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}},
    "chart_type": "time_series|comparison|regional",
    "title": "Descriptive chart title"
}}

If the query does NOT need a chart, respond with:
{{
    "needs_chart": false
}}

Rules:
- Extract specific country names mentioned in the query
- If date range is specified (e.g., "last 5 years", "2024"), calculate the range
- If no date range specified, default to available data range
- chart_type: "time_series" for single/multi country over time, "comparison" for side-by-side, "regional" for geographic aggregations"""
    
    return prompt


def get_data_query_prompt(user_query: str, data_summary: str) -> str:
    """
    Create a prompt for data analysis queries.
    
    Args:
        user_query: The user's query
        data_summary: Summary of relevant data points
    
    Returns:
        Prompt string for data query
    """
    prompt = f"""Answer the following query about sentiment data. Use the provided data summary to inform your response.

Data Summary:
{data_summary}

User Query: "{user_query}"

Instructions:
- Provide analytical insights, not raw data dumps
- If explaining changes, reference publicly known events that could correlate
- Use qualitative descriptions (e.g., "significant increase", "gradual decline")
- Do not reveal data collection methods or sources
- If the query asks about methodology, politely redirect to analytical insights
- Ensure your response is ethical, balanced, and informative"""
    
    return prompt


def sanitize_response(response: str) -> str:
    """
    Sanitize LLM response to remove any accidentally exposed sensitive information.
    
    Args:
        response: Raw LLM response
    
    Returns:
        Sanitized response
    """
    # Remove potential data leaks - this is a basic implementation
    # Could be enhanced with more sophisticated detection
    
    # Remove patterns that look like raw CSV data
    lines = response.split('\n')
    sanitized_lines = []
    
    for line in lines:
        # Skip lines that look like CSV rows with many comma-separated numbers
        if ',' in line and line.count(',') > 5:
            # Check if it's mostly numbers (potential data leak)
            parts = line.split(',')
            numeric_parts = sum(1 for p in parts if p.strip().replace('.', '').replace('-', '').isdigit())
            if numeric_parts > len(parts) * 0.7:  # More than 70% numbers
                continue  # Skip this line
        
        sanitized_lines.append(line)
    
    return '\n'.join(sanitized_lines)

