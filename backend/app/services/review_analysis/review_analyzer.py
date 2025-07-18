# dynamic_review_analyzer.py
import json
import time

from core.config import settings
from db.repositories.llm_logs import LLMLogRepository
from google import genai
from models.analysis_requests import ReviewInput
from models.analysis_schemas import (
    AnalysisTask,
    BusinessInsights,
    LanguageAnalysis,
    SentimentAnalysis,
    SpamDetection,
    TopicAnalysis,
    TranslationAnalysis,
    UrgencyClassification,
)
from models.llm_log import (
    LLMLogCreate,
    LLMResponse,
    PerformanceMetrics,
    RequestMetadata,
    UsageContext,
)
from pydantic import BaseModel, Field, ValidationError, create_model

API_KEY = settings.GIMINI_API_KEY
MODEL_NAME = settings.GIMINI_MODEL_NAME
client = genai.Client(api_key=API_KEY)

BATCH_SIZES = [1, 3, 5, 10, 20, 50, 100]

models = {
    "gemini-2.5-flash-lite-preview-06-17": {
        "description": "A lightweight version of Gemini 2.5, optimized for speed and efficiency.",
        "price_per_million_tokens": {"input": 0.1, "output": 0.4},
    },
    "gemini-2.0-flash-lite": {
        "description": "An earlier version of Gemini 2.5 Flash Lite, still efficient",
        "price_per_million_tokens": {"input": 0.75, "output": 0.3},
    },
}


class SchemaBuilder:
    """Builds dynamic Pydantic schemas based on requested tasks"""

    TASK_SCHEMA_MAP = {
        AnalysisTask.LANGUAGE_DETECTION: ("language_analysis", LanguageAnalysis),
        AnalysisTask.TRANSLATION: ("translation_analysis", TranslationAnalysis),
        AnalysisTask.SENTIMENT: ("sentiment", SentimentAnalysis),
        AnalysisTask.TOPICS: ("topics", list[TopicAnalysis]),
        AnalysisTask.SPAM_DETECTION: ("spam_detection", SpamDetection),
        AnalysisTask.URGENCY: ("urgency_classification", UrgencyClassification),
        AnalysisTask.BUSINESS_INSIGHTS: ("business_insights", BusinessInsights),
    }

    @classmethod
    def create_schema(cls, tasks: list[AnalysisTask]) -> type[BaseModel]:
        """Create a dynamic Pydantic schema based on requested tasks"""

        if not tasks:
            raise ValueError("At least one task must be specified")

        # Build field definitions
        field_definitions = {}

        # Add common fields
        field_definitions["review_id"] = (
            str,
            Field(..., description="Unique review identifier"),
        )
        for task in tasks:
            if task not in cls.TASK_SCHEMA_MAP:
                raise ValueError(f"Unknown task: {task}")

            field_name, field_type = cls.TASK_SCHEMA_MAP[task]
            field_definitions[field_name] = (
                field_type,
                Field(..., description=f"Results for {task.value}"),
            )

        # Create dynamic model
        DynamicSchema = create_model(
            "DynamicReviewAnalysisResponse", **field_definitions, __base__=BaseModel
        )

        return DynamicSchema

    @classmethod
    def create_batch_schema(cls, base_schema: type[BaseModel]) -> type[BaseModel]:
        """Create batch wrapper for complex schemas"""
        BatchWrapper = create_model(
            "BatchWrapper",
            results=(
                list[base_schema],
                Field(..., description="Analysis results for each review"),
            ),
            __base__=BaseModel,
        )
        return BatchWrapper


class PromptBuilder:
    """Builds dynamic prompts based on requested tasks and input data"""

    TASK_INSTRUCTIONS = {
        AnalysisTask.LANGUAGE_DETECTION: "1. Detect the language of the review using ISO 639-1 codes",
        AnalysisTask.TRANSLATION: "2. Translate the review to English if it's not already in English",
        AnalysisTask.SENTIMENT: "3. Analyze overall sentiment with confidence score and emotional tone",
        AnalysisTask.TOPICS: "4. Identify all significant topics mentioned with their individual sentiments",
        AnalysisTask.SPAM_DETECTION: "5. Detect if the review is spam/fake with confidence and red flags",
        AnalysisTask.URGENCY: "6. Classify urgency level for customer service response",
        AnalysisTask.BUSINESS_INSIGHTS: "7. Extract actionable business insights and recommendations",
    }

    @classmethod
    def create_prompt(
        cls,
        reviews: list[ReviewInput],
        tasks: list[AnalysisTask],
        target_topics: list[str] | None = None,
        business_context: str | None = None,
    ) -> str:
        """Create dynamic prompt for single or batch review analysis"""

        # Build task instructions
        task_instructions = []
        for task in tasks:
            if task in cls.TASK_INSTRUCTIONS:
                instruction = cls.TASK_INSTRUCTIONS[task]

                # Add specific guidance for topics task
                if task == AnalysisTask.TOPICS and target_topics:
                    instruction += f"\n   Focus on these business-relevant topics: {', '.join(target_topics)}"
                elif task == AnalysisTask.TOPICS:
                    instruction += "\n   Identify all significant topics mentioned. Be comprehensive and specific."

                task_instructions.append(instruction)

        instructions_text = "\n".join(task_instructions)

        # Determine if single or batch
        is_batch = len(reviews) > 1

        if is_batch:
            # Batch prompt
            reviews_text = "\n".join(
                [
                    f"Review {i + 1}:\n"
                    f"Review ID: {review.review_id}\n"
                    f'Text: "{review.text}"\n'
                    f"Rating: {review.rating if review.rating is not None else 'Not provided'}\n"
                    f"Business Type: {review.business_type if review.business_type is not None else 'unknown'}\n"
                    f"---"
                    for i, review in enumerate(reviews)
                ]
            )

            prompt = f"""
You are an expert review analyzer. Analyze these {len(reviews)} customer reviews.

{business_context if business_context else ""}

REVIEWS TO ANALYZE:
{reviews_text}

ANALYSIS TASKS:
{instructions_text}

IMPORTANT GUIDELINES:
- Be thorough but concise
- All confidence scores should be between 0.0 and 1.0
- Multiple topics are expected and encouraged
- Provide specific, actionable insights
- Return analysis for each review in the order provided

Return a JSON array with {len(reviews)} analysis objects.
"""
        else:
            # Single review prompt
            review = reviews[0]
            prompt = f"""
You are an expert review analyzer. Analyze this customer review comprehensively.

{business_context if business_context else ""}

REVIEW TO ANALYZE:
Text: "{review.text}"
Rating: {review.rating or "Not provided"}
Business Type: {review.business_type or "unknown"}

ANALYSIS TASKS:
{instructions_text}

IMPORTANT GUIDELINES:
- Be thorough but concise
- All confidence scores should be between 0.0 and 1.0
- Multiple topics are expected and encouraged
- Provide specific, actionable insights

Return a single JSON object with complete analysis.
"""

        return prompt.strip()


class DynamicReviewAnalyzer:
    """Main class that orchestrates dynamic review analysis"""

    def __init__(self, client, model_name: str, pricing: dict[str, float]):
        self.client = client
        self.model_name = model_name
        self.pricing = pricing
        self.llm_log_repo = LLMLogRepository()

    async def analyze(
        self,
        reviews: list[ReviewInput],
        tasks: list[AnalysisTask],
        target_topics: list[str] | None = None,
        business_context: str | None = None,
        user_id: str | None = None,  # Add user_id for logging
    ):
        """Perform dynamic analysis based on specified tasks"""

        # Create dynamic schema
        schema = SchemaBuilder.create_schema(tasks)

        # Handle batch vs single
        is_batch = len(reviews) > 1
        response_schema = (
            SchemaBuilder.create_batch_schema(schema) if is_batch else schema
        )

        # Create prompt
        prompt = PromptBuilder.create_prompt(
            reviews=reviews,
            tasks=tasks,
            target_topics=target_topics,
            business_context=business_context,
        )

        try:
            start = time.time()
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": response_schema,
                },
            )
            duration = time.time() - start
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "analysis": None,
                "duration": None,
                "cost": None,
                "raw_response": None,
            }

        try:
            # Parse response
            result_dict = json.loads(response.text)

            # Validate with Pydantic
            analysis = response_schema(**result_dict)

            # Calculate cost
            cost = self._calculate_cost(response.usage_metadata)

            llm_log = LLMLogCreate(
                user_id=user_id,  # Need to pass this parameter
                request_metadata=RequestMetadata(
                    model_name=self.model_name,
                    tasks=[task.value for task in tasks],
                    batch_size=len(reviews),
                    review_count=len(reviews),
                    prompt=prompt,
                    prompt_length=len(prompt),
                ),
                performance=PerformanceMetrics(
                    duration_seconds=duration,
                    input_tokens=response.usage_metadata.prompt_token_count,
                    output_tokens=response.usage_metadata.candidates_token_count,
                    total_tokens=response.usage_metadata.total_token_count,
                    cost=cost,
                ),
                llm_response=LLMResponse(
                    raw_text=response.text,
                    parsed_json=result_dict,
                    success=True,
                    error=None,
                ),
                usage_context=UsageContext(
                    source="api",  # or pass as parameter
                    subscription_tier=None,  # or pass as parameter
                ),
            )

            # Save to database
            await self.llm_log_repo.create(llm_log)

            return {
                "success": True,
                "analysis": analysis,
                "duration": duration,
                "cost": cost,
                "raw_response": response,
            }
        except json.JSONDecodeError as e:
            return {
                "success": False,
                "error": f"JSON parsing error: {e}",
                "analysis": None,
                "duration": duration,
                "cost": None,
                "raw_response": response,
            }
        except ValidationError as e:
            return {
                "success": False,
                "error": f"Pydantic validation error: {e}",
                "analysis": None,
                "duration": duration,
                "cost": None,
                "raw_response": response,
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "analysis": None,
                "duration": None,
                "cost": None,
                "raw_response": response,
            }

    def _calculate_cost(self, usage_metadata) -> float:
        """Calculate API cost"""
        input_cost = (usage_metadata.prompt_token_count / 1000000) * self.pricing[
            "input"
        ]
        output_cost = (usage_metadata.candidates_token_count / 1000000) * self.pricing[
            "output"
        ]
        return input_cost + output_cost


analysis_tasks = [
    AnalysisTask.LANGUAGE_DETECTION,
    AnalysisTask.TRANSLATION,
    AnalysisTask.SENTIMENT,
    AnalysisTask.TOPICS,
    AnalysisTask.SPAM_DETECTION,
    AnalysisTask.URGENCY,
    AnalysisTask.BUSINESS_INSIGHTS,
]

review_analyzer = DynamicReviewAnalyzer(
    client=client,
    model_name=MODEL_NAME,
    pricing=models[MODEL_NAME]["price_per_million_tokens"],
)
