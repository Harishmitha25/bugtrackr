
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.embeddings import build_text_input
from app import embeddings
import numpy as np

import logging
logging.basicConfig(level=logging.INFO)

client = TestClient(app)

#Sample test data
valid_bug_input = {
    "application": "Requirements Management App",
    "title": "Login button not working",
    "description": "Clicking the login button does nothing",
    "stepsToReproduce": "Open browser and click login",
    "userSteps": {
        "step1": "Go to homepage",
        "step2": "click on login"
    }
}

#Invalid test data (missing 'application' field)
missing_application_bug_input = {
    "title": "Login button not working",
    "description": "Clicking the login button does nothing",
    "stepsToReproduce": "Open browser and click login",
    "userSteps": {
        "step1": "Go to homepage",
        "step2": "click on login"
    }
}

#Search test data
valid_search_query = {
    "application": "Requirements Management App",
    "query": "login issue in chrome"
}

missing_query_search = {
    "application": "Requirements Management App"
}


#Check build text input
def test_build_text_input():
    title = "Login not working"
    description = "Form submission fails"
    steps = "Click on login"
    user_steps = {"step1": "Go to homepage", "step2": "Click login"}

    result = build_text_input(title, description, steps, user_steps)
    expected = "Login not working Form submission fails Click on login Go to homepage Click login"

    assert result == expected

#Check for empty result
def test_search_similar_empty_index():
    results = embeddings.search_similar("RAndom app", "something")
    assert results == []
    
#Check for empty result
def test_search_similar_priority_empty():
    results = embeddings.search_similar_priority_bugs("RAndom app", "something")
    assert results == []

#Check duplicate endpoint with valid input
def test_check_duplicate_valid():
    response = client.post("/check-duplicate", json=valid_bug_input)
    assert response.status_code == 200
    assert "similar_bugs" in response.json()

#Check duplicate endpoint with missing application
def test_check_duplciate_missing_application():
    response = client.post("/check-duplicate", json=missing_application_bug_input)
    assert response.status_code == 422
    error_detail = response.json()
    assert "detail" in error_detail
    logging.info(error_detail)
    assert error_detail["detail"][0]["loc"][-1] == "application"
    assert error_detail["detail"][0]["msg"] == "Field required"

#Search endpoint with valid query
def test_search_semantic_valid():
    response = client.post("/search/semantic", json=valid_search_query)
    assert response.status_code == 200
    assert "similar_bugs" in response.json()

#Search endpoint with missing query
def test_search_semantic_missing_query():
    response = client.post("/search/semantic", json=missing_query_search)
    assert response.status_code == 422
    error_detail = response.json()
    assert "detail" in error_detail
    assert error_detail["detail"][0]["loc"][-1] == "query"
    assert error_detail["detail"][0]["msg"] == "Field required"
#Add embedding with valid data
def test_add_embedding():
    bug_data = valid_bug_input.copy()
    bug_data["bugId"] = "BUG-123"
    response = client.post("/add-embedding", json=bug_data)
    assert response.status_code == 200
    assert response.json()["message"] == "Embedding added"

#Add priority embedding with valid data
def test_add_priority_embedding():
    bug_data = valid_bug_input.copy()
    bug_data["bugId"] = "BUG-123"
    response = client.post("/add-priority-embedding", json=bug_data)
    assert response.status_code == 200
    assert response.json()["message"] == "Priority embedding added"


#Valid classify prirority input (should return 200 with similar bugs or empty list)
def test_classify_priority_valid():
    response = client.post("/similar-bugs-for-classify-priority", json=valid_search_query)
    assert response.status_code == 200
    assert "similar_bugs" in response.json()
    assert isinstance(response.json()["similar_bugs"], list)

#Missing 'query' in classify priority input
def test_classify_priority_missing_query():
    incomplete_query = {
        "application": "Requirements Management App"
    }
    response = client.post("/similar-bugs-for-classify-priority", json=incomplete_query)
    assert response.status_code == 422
    error_detail = response.json()
    assert "detail" in error_detail
    assert error_detail["detail"][0]["loc"][-1] == "query"
    assert error_detail["detail"][0]["msg"] == "Field required"

#Add embedding and retrieve it back via semantic search
def test_add_and_search_embedding():
    #Add a bug embedding
    bug_id = "BUG-123"
    bug_data = {
        "application": "Requirements Management App",
        "bugId": bug_id,
        "title": "Cannot submit login form",
        "description": "The form does not send data when login is clicked",
        "stepsToReproduce": "Open browser and try to log in",
        "userSteps": {"step1": "Enter email", "step2": "Click Login"}
    }
    add_response = client.post("/add-embedding", json=bug_data)
    assert add_response.status_code == 200
    assert add_response.json()["message"] == "Embedding added"

    #Perform semantic search with a similar
    search_query = {
        "application": "Requirements Management App",
        "query": "Login button does not submit form"
    }
    search_response = client.post("/search/semantic", json=search_query)
    assert search_response.status_code == 200
    result = search_response.json()["similar_bugs"]

    #should get at least one result and it includes the test bug
    assert isinstance(result, list)
    assert any(entry["bug_id"] == bug_id for entry in result)

#Add embedding and retrieve it back via semantic search
def test_add_and_classify_priority():
    #Add a bug embedding
    bug_id = "BUG-123"
    bug_data = {
        "application": "Requirements Management App",
        "bugId": bug_id,
        "title": "Critical issue in login form",
        "description": "Login form crashes the app",
        "stepsToReproduce": "Click on login button after entering credentials",
        "userSteps": {"step1": "Enter valid input", "step2": "Click submit"}
    }

    #Add priority embedding (status = Closed)
    response = client.post("/add-priority-embedding", json=bug_data)
    assert response.status_code == 200
    assert response.json()["message"] == "Priority embedding added"

    #Clasisfy using a similar query
    search_query = {
        "application": "Requirements Management App",
        "query": "Login page crashes when clicking submit"
    }

    classify_response = client.post("/similar-bugs-for-classify-priority", json=search_query)
    assert classify_response.status_code == 200
    results = classify_response.json()["similar_bugs"]

    #Check test bug ID appears in the results
    assert any(entry["bug_id"] == bug_id for entry in results)

#Add embedding missing fields
def test_add_embedding_missing_fields():
    #Missing title, description, steps
    incomplete_bug_data = {
        "application": "Requirements Management App",
        "bugId": "missing-fields-bug"
    }

    response = client.post("/add-embedding", json=incomplete_bug_data)
    assert response.status_code == 422
    assert "detail" in response.json()

#Similar bug over threshold
def test_similarity_score_above_threshold():
    bug_id = "BUG-123"
    text = "User cannot submit login form after entering credentials"

    #Add embedding
    response = client.post("/add-embedding", json={
        "application": "Requirements Management App",
        "bugId": bug_id,
        "title": "Login error",
        "description": text,
        "stepsToReproduce": "",
        "userSteps": {}
    })
    assert response.status_code == 200

    #Search with almost the same text
    response = client.post("/search/semantic", json={
        "application": "Requirements Management App",
        "query": "User is unable to submit login form with valid credentials"
    })
    assert response.status_code == 200
    results = response.json()["similar_bugs"]

    #Check match is found and score is high
    assert any(entry["bug_id"] == bug_id and entry["score"] >= 0.6 for entry in results)
