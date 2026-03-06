"""
TabPilot Backend API Tests
Tests for:
- Health endpoint
- Sessions CRUD
- Suggestions endpoint
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestHealthEndpoint:
    """Test base API endpoint"""
    
    def test_api_root_returns_200(self, api_client):
        """Test that the API root endpoint returns 200"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "TabPilot API"
        print("✓ API root endpoint returns 200 with correct message")


class TestSessionsCRUD:
    """Test Sessions CRUD operations"""
    
    def test_get_sessions_returns_200(self, api_client):
        """Test GET /api/sessions returns list"""
        response = api_client.get(f"{BASE_URL}/api/sessions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/sessions returns {len(data)} sessions")
    
    def test_create_session_and_verify_persistence(self, api_client):
        """Test POST /api/sessions creates a session and verify with GET"""
        # CREATE session
        session_name = f"TEST_Session_{uuid.uuid4().hex[:8]}"
        create_payload = {
            "name": session_name,
            "windows": [
                {
                    "tabs": [
                        {"url": "https://example.com", "title": "Example", "pinned": False},
                        {"url": "https://test.com", "title": "Test Site", "pinned": True}
                    ]
                }
            ]
        }
        
        response = api_client.post(f"{BASE_URL}/api/sessions", json=create_payload)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        # Verify response data
        created_session = response.json()
        assert created_session["name"] == session_name
        assert "id" in created_session
        assert created_session["window_count"] == 1
        assert created_session["tab_count"] == 2
        assert "saved_at" in created_session
        
        session_id = created_session["id"]
        print(f"✓ Created session: {session_id}")
        
        # GET to verify persistence
        get_response = api_client.get(f"{BASE_URL}/api/sessions")
        assert get_response.status_code == 200
        sessions = get_response.json()
        
        # Find the created session in the list
        found_session = next((s for s in sessions if s["id"] == session_id), None)
        assert found_session is not None, f"Session {session_id} not found in list"
        assert found_session["name"] == session_name
        print(f"✓ Session {session_id} found in GET /api/sessions list")
        
        # Cleanup - delete the test session
        delete_response = api_client.delete(f"{BASE_URL}/api/sessions/{session_id}")
        assert delete_response.status_code == 200
        print(f"✓ Cleaned up test session: {session_id}")
    
    def test_delete_session_and_verify_removal(self, api_client):
        """Test DELETE /api/sessions/{id} removes session"""
        # First CREATE a session
        session_name = f"TEST_ToDelete_{uuid.uuid4().hex[:8]}"
        create_payload = {
            "name": session_name,
            "windows": [{"tabs": [{"url": "https://delete-test.com", "title": "Delete Test", "pinned": False}]}]
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/sessions", json=create_payload)
        assert create_response.status_code == 201
        session_id = create_response.json()["id"]
        print(f"✓ Created session for deletion test: {session_id}")
        
        # DELETE the session
        delete_response = api_client.delete(f"{BASE_URL}/api/sessions/{session_id}")
        assert delete_response.status_code == 200
        delete_data = delete_response.json()
        assert delete_data["status"] == "deleted"
        print(f"✓ DELETE /api/sessions/{session_id} returned 200")
        
        # Verify removal - GET all sessions and check it's gone
        get_response = api_client.get(f"{BASE_URL}/api/sessions")
        assert get_response.status_code == 200
        sessions = get_response.json()
        
        found_session = next((s for s in sessions if s["id"] == session_id), None)
        assert found_session is None, f"Session {session_id} should not exist after deletion"
        print(f"✓ Verified session {session_id} no longer exists")


class TestSuggestionsEndpoint:
    """Test suggestions endpoint"""
    
    def test_create_suggestion_success(self, api_client):
        """Test POST /api/suggestions creates a suggestion"""
        suggestion_payload = {
            "name": "Test User",
            "message": f"TEST_Suggestion_{uuid.uuid4().hex[:8]}: This is a test suggestion for TabPilot"
        }
        
        response = api_client.post(f"{BASE_URL}/api/suggestions", json=suggestion_payload)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        # Verify response data
        suggestion = response.json()
        assert suggestion["name"] == suggestion_payload["name"]
        assert suggestion["message"] == suggestion_payload["message"]
        assert "id" in suggestion
        assert "created_at" in suggestion
        print(f"✓ Created suggestion: {suggestion['id']}")
    
    def test_create_suggestion_with_empty_name(self, api_client):
        """Test POST /api/suggestions works with empty name (name is optional)"""
        suggestion_payload = {
            "name": "",
            "message": f"TEST_Anonymous_{uuid.uuid4().hex[:8]}: Suggestion without name"
        }
        
        response = api_client.post(f"{BASE_URL}/api/suggestions", json=suggestion_payload)
        assert response.status_code == 201
        
        suggestion = response.json()
        assert suggestion["name"] == ""
        assert suggestion["message"] == suggestion_payload["message"]
        print("✓ Created anonymous suggestion (empty name)")
    
    def test_create_suggestion_missing_message_fails(self, api_client):
        """Test POST /api/suggestions fails without message"""
        suggestion_payload = {
            "name": "Test User"
            # message is missing - should fail
        }
        
        response = api_client.post(f"{BASE_URL}/api/suggestions", json=suggestion_payload)
        # Should fail with 422 Unprocessable Entity (validation error)
        assert response.status_code == 422
        print("✓ POST /api/suggestions correctly rejects missing message")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
