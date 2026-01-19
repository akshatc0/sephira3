import openai
from typing import List, Dict, Optional, Tuple, Any
import json
import logging

from config import Config
from utils.prompt_templates import (
    get_system_prompt,
    get_chart_request_prompt,
    get_data_query_prompt,
    sanitize_response
)
from utils.query_parser import QueryParser
from services.guardrail_service import GuardrailService

logger = logging.getLogger(__name__)


class LLMService:
    
    def __init__(self, data_service: Any, guardrail_service: GuardrailService):
        self.data_service = data_service
        self.guardrail_service = guardrail_service
        
        if not Config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")
        
        self.client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)
        self.model = Config.OPENAI_MODEL
        self.temperature = Config.OPENAI_TEMPERATURE
        
        countries = data_service.get_countries()
        date_range = data_service.get_date_range()
        self.system_prompt = get_system_prompt(countries, date_range)
        
        self.query_parser = QueryParser(countries, date_range)
    
    def process_query(self, user_query: str, conversation_history: Optional[List[Dict]] = None,
                     session_id: Optional[str] = None) -> Dict[str, Any]:
        try:
            is_allowed, rejection_reason, category = self.guardrail_service.validate_query(user_query)
            
            if not is_allowed:
                return {
                    "response": rejection_reason,
                    "chart_request": None,
                    "session_id": session_id,
                    "blocked": True,
                    "block_category": category
                }
            
            chart_request = self._detect_chart_request(user_query, conversation_history)
            
            # Extract countries and date range from query
            parsed_query = self.query_parser.parse_query(user_query)
            countries = parsed_query["countries"]
            date_range = parsed_query["date_range"]
            
            # Get actual data for the query
            data_summary = ""
            if countries:
                data_summary = self.data_service.get_data_summary(
                    countries,
                    date_range.get("start"),
                    date_range.get("end")
                )
            else:
                data_summary = self.get_data_summary_for_query(user_query)
            
            messages = self._prepare_messages(user_query, conversation_history, data_summary)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature
            )
            
            if not response.choices or len(response.choices) == 0:
                raise ValueError("OpenAI API returned no choices")
            
            llm_response = response.choices[0].message.content
            if llm_response is None:
                raise ValueError("OpenAI API returned empty content")
            
            sanitized_response = sanitize_response(llm_response)
            sanitized_response = self.guardrail_service.sanitize_response(sanitized_response)
            
            if chart_request and chart_request.get("needs_chart"):
                chart_params = self._extract_chart_parameters(user_query, sanitized_response)
                if chart_params:
                    chart_request.update(chart_params)
            
            return {
                "response": sanitized_response,
                "chart_request": chart_request if chart_request and chart_request.get("needs_chart") else None,
                "session_id": session_id,
                "blocked": False
            }
            
        except openai.RateLimitError:
            logger.error("OpenAI API rate limit exceeded")
            return {
                "response": "I'm experiencing high demand right now. Please try again in a moment.",
                "chart_request": None,
                "session_id": session_id,
                "error": "rate_limit"
            }
        except openai.APIError as e:
            logger.error(f"OpenAI API error: {e}")
            error_msg = str(e).lower()
            if "authentication" in error_msg or "invalid" in error_msg:
                response_msg = "I'm having trouble connecting to the service. Please check your configuration."
            elif "timeout" in error_msg or "connection" in error_msg:
                response_msg = "The request took too long. Please try again with a simpler query."
            elif "quota" in error_msg or "billing" in error_msg:
                response_msg = "Service quota exceeded. Please try again later."
            else:
                response_msg = "I'm having trouble processing that request right now. Could you try rephrasing your question?"
            return {
                "response": response_msg,
                "chart_request": None,
                "session_id": session_id,
                "error": "api_error"
            }
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                "response": "I'm having trouble with that request. Could you try rephrasing your question or asking something else?",
                "chart_request": None,
                "session_id": session_id,
                "error": "internal_error"
            }
    
    def _detect_chart_request(self, user_query: str, 
                             conversation_history: Optional[List[Dict]]) -> Optional[Dict[str, Any]]:
        chart_keywords = [
            'chart', 'graph', 'plot', 'visualize', 'visualization',
            'show me', 'display', 'create a chart', 'make a graph'
        ]
        
        query_lower = user_query.lower()
        
        needs_chart = any(keyword in query_lower for keyword in chart_keywords)
        
        if needs_chart:
            prompt = get_chart_request_prompt(user_query, conversation_history)
            
            try:
                # Use cheaper model for structured extraction
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a chart parameter extraction assistant. Respond only with valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
                
                if not response.choices or len(response.choices) == 0:
                    logger.warning("Chart detection API returned no choices")
                    return {"needs_chart": True}
                
                content = response.choices[0].message.content
                if content is None:
                    logger.warning("Chart detection API returned empty content")
                    return {"needs_chart": True}
                
                result = json.loads(content)
                return result
                
            except Exception as e:
                logger.warning(f"Error extracting chart parameters: {e}")
                return {"needs_chart": True}
        
        return None
    
    def _extract_chart_parameters(self, user_query: str, llm_response: str) -> Optional[Dict[str, Any]]:
        return None
    
    def _prepare_messages(self, user_query: str, 
                         conversation_history: Optional[List[Dict]],
                         data_summary: str = "") -> List[Dict[str, str]]:
        messages = [
            {"role": "system", "content": self.system_prompt}
        ]
        
        # Add conversation history (last 10 turns to avoid token limits)
        if conversation_history:
            for turn in conversation_history[-10:]:
                if turn.get("user"):
                    messages.append({"role": "user", "content": turn["user"]})
                if turn.get("assistant"):
                    messages.append({"role": "assistant", "content": turn["assistant"]})
        
        user_message = user_query
        
        # Include actual data in user message for LLM context
        if data_summary:
            user_message = f"""Based on the following actual data from the sentiment dataset, please answer the user's query:

ACTUAL DATA:
{data_summary}

USER QUERY: {user_query}

Please provide an accurate analysis based on the actual data provided above. Reference specific values, trends, and patterns from the data when answering."""
        
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    def get_data_summary_for_query(self, query: str) -> str:
        parsed_query = self.query_parser.parse_query(query)
        countries = parsed_query["countries"]
        date_range = parsed_query["date_range"]
        
        if not countries:
            return "No specific countries mentioned in the query. Please specify which countries you'd like to analyze."
        
        return self.data_service.get_data_summary(
            countries,
            date_range.get("start"),
            date_range.get("end")
        )
