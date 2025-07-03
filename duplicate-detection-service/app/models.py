from pydantic import BaseModel
from typing import Optional

#For checking duplicate
class BugInput(BaseModel):
    application: str
    title: str
    description: str
    stepsToReproduce: Optional[str] = ""
    userSteps: Optional[dict] = {}

#For adding embedding
class BugAdd(BaseModel):
    application: str
    bugId: str
    title: str
    description: str
    stepsToReproduce: Optional[str] = ""
    userSteps: Optional[dict] = {}

#For search query
class SearchQuery(BaseModel):
    application: str
    query: str
