import requests
import sys
import json
from datetime import datetime

class TabPilotAPITester:
    def __init__(self, base_url="https://browser-cockpit.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        response_data = response.json()
                        print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    except:
                        print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if success and response.text else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection error")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "api/", 200)

    def test_get_sessions_empty(self):
        """Test get sessions endpoint (should work even if empty)"""
        return self.run_test("Get Sessions (Empty)", "GET", "api/sessions", 200)

    def test_create_session(self):
        """Test creating a new session"""
        test_session = {
            "name": "Test Session",
            "windows": [
                {
                    "tabs": [
                        {
                            "url": "https://example.com",
                            "title": "Example",
                            "pinned": False
                        },
                        {
                            "url": "https://github.com",
                            "title": "GitHub",
                            "pinned": True
                        }
                    ]
                },
                {
                    "tabs": [
                        {
                            "url": "https://stackoverflow.com",
                            "title": "Stack Overflow",
                            "pinned": False
                        }
                    ]
                }
            ]
        }
        success, response = self.run_test("Create Session", "POST", "api/sessions", 201, test_session)
        if success and 'id' in response:
            return response['id']
        return None

    def test_get_sessions_with_data(self):
        """Test get sessions after creating one"""
        return self.run_test("Get Sessions (With Data)", "GET", "api/sessions", 200)

    def test_delete_session(self, session_id):
        """Test deleting a session"""
        if not session_id:
            print("⚠️  Skipping delete test - no session ID available")
            return False, {}
        return self.run_test("Delete Session", "DELETE", f"api/sessions/{session_id}", 200)

def main():
    print("🚀 Starting TabPilot Backend API Tests")
    print("=" * 50)
    
    tester = TabPilotAPITester()
    
    # Test 1: API Root
    tester.test_api_root()
    
    # Test 2: Get Sessions (empty)
    tester.test_get_sessions_empty()
    
    # Test 3: Create Session
    session_id = tester.test_create_session()
    
    # Test 4: Get Sessions (with data)
    tester.test_get_sessions_with_data()
    
    # Test 5: Delete Session
    tester.test_delete_session(session_id)
    
    # Final Results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())