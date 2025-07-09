import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_auth_flow():
    print("🧪 Testing Authentication Flow...")
    
    # Test data
    user_data = {
        "username": "testuser16",
        "email": "test16@example.com", 
        "password": "password123"
    }
    
    # 1. Test Registration
    print("\n1️⃣ Testing Registration...")
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        if response.status_code == 200:
            print("✅ Registration successful!")
            print(f"Response: {response.json()}")
        elif response.status_code == 409:
            print("ℹ️ User already exists, skipping registration")
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"Error: {response.text}")
            return
    except Exception as e:
        print(f"❌ Registration request failed: {e}")
        return
    
    # 2. Test Login
    print("\n2️⃣ Testing Login...")
    try:
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"]
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=login_data,  # Note: form data, not JSON
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            print("✅ Login successful!")
            token_data = response.json()
            access_token = token_data["access_token"]
            print(f"Token type: {token_data['token_type']}")
            print(f"Token: {access_token[:50]}...")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Error: {response.text}")
            return
    except Exception as e:
        print(f"❌ Login request failed: {e}")
        return
    
    # 3. Test Protected Route
    print("\n3️⃣ Testing Protected Route...")
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if response.status_code == 200:
            print("✅ Protected route access successful!")
            user_info = response.json()
            print(f"User info: {json.dumps(user_info, indent=2)}")
        else:
            print(f"❌ Protected route failed: {response.status_code}")
            print(f"Error: {response.text}")
            return
    except Exception as e:
        print(f"❌ Protected route request failed: {e}")
        return
    
    # 4. Test Business Creation (Protected)
    print("\n4️⃣ Testing Business Creation...")
    try:
        business_data = {"name": "Test Business"}
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.post(
            f"{BASE_URL}/businesses", 
            json=business_data, 
            headers=headers
        )
        
        if response.status_code == 201:
            print("✅ Business creation successful!")
            business = response.json()
            print(f"Business created: {business['name']} (ID: {business['id']})")
        else:
            print(f"❌ Business creation failed: {response.status_code}")
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Business creation request failed: {e}")
    
    print("\n🎉 Authentication test completed!")
    
    
    # 5. Delete Test User
    print("\n5️⃣ Cleaning up test user...")
    try:
        response = requests.delete(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 204:
            print("✅ Test user deleted successfully!")
        else:
            print(f"❌ Failed to delete test user: {response.status_code}")
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ User deletion request failed: {e}")

if __name__ == "__main__":
    test_auth_flow()