import os

from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate
from langchain_ollama import OllamaLLM
from langsmith import traceable

QWEN2_5_MODEL = "qwen2.5:3b-instruct"
GEMMA3_27B_MODEL = "gemma3:27b"

# Configure LangSmith
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "REMOVED_API_KEY"
os.environ["LANGCHAIN_PROJECT"] = "reviews-analysis"

# Initialize model
# Initialize model with optimizations
model = OllamaLLM(
    model=QWEN2_5_MODEL,
    base_url="http://host.docker.internal:11434",  # Explicit URL
    temperature=0.0,  # Control randomness
    num_predict=256,  # Limit output length
    top_k=10,  # Faster sampling
    top_p=0.9,  # Faster sampling
    repeat_penalty=1.1,  # Prevent repetition
    timeout=30,  # Reasonable timeout
)


@traceable
async def summarize_reviews(reviews: list) -> str:
    """
    Summarize a list of reviews using the Qwen2.5 model.

    Args:
        reviews (list): List of review strings to summarize.

    Returns:
        str: Summary of the reviews.
    """
    if not reviews:
        return "No reviews to summarize."

    # Combine reviews into a single text
    review_text = "\n".join(reviews)

    # Create a prompt for summarization
    template = """Analyze the following customer reviews for a business. Provide a clear, helpful, and realistic summary for the business owner, emphasizing the overall sentiment, main points of satisfaction or complaints, and any actionable suggestions.

    Reviews:
    {review_text}

    Summary:"""

    prompt = PromptTemplate.from_template(template)

    # Chain the_prompt with the_model
    chain = LLMChain(llm=model, prompt=prompt)
    response = await chain.arun(review_text=review_text)

    return response.strip()
