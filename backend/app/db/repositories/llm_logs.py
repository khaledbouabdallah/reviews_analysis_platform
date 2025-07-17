from db.mongodb import llm_logs_collection
from db.repositories.base_repository import BaseRepository
from models.llm_log import LLMLogCreate, LLMLogInDB, LLMLogUpdate


class JobRepository(BaseRepository[LLMLogCreate, LLMLogUpdate, LLMLogInDB]):
    def __init__(self):
        super().__init__(llm_logs_collection, LLMLogInDB)
