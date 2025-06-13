import os
from langchain_ollama import OllamaLLM
from langsmith import traceable

QWEN2_5_MODEL = "qwen2.5:3b-instruct"
GEMMA3_27B_MODEL = "gemma3:27b"

# Configure LangSmith
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "REMOVED_API_KEY"
os.environ["LANGCHAIN_PROJECT"] = "ollama-playground"

# Initialize model
# Initialize model with optimizations
model = OllamaLLM(
    model=QWEN2_5_MODEL,
    base_url="http://localhost:11434",  # Explicit URL
    temperature=0.0,                    # Control randomness
    num_predict=256,                    # Limit output length
    top_k=10,                          # Faster sampling
    top_p=0.9,                         # Faster sampling
    repeat_penalty=1.1,                # Prevent repetition
    timeout=30,                        # Reasonable timeout
)

# to be implemented 