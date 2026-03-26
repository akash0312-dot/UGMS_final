import requests

# 1. Login as Admin
res = requests.post("http://localhost:5000/api/auth/login", json={"email": "admin@ugms.com", "password": "admin123"})
if res.status_code != 200:
    print("Admin login failed:", res.text)
    exit()
admin_token = res.json()["access_token"]

# 2. Login as W001
res = requests.post("http://localhost:5000/api/auth/worker/login", json={"worker_code": "W001", "password": "abc@123"})
if res.status_code != 200:
    print("Worker login failed:", res.text)
    exit()
worker_token = res.json()["access_token"]

# 3. Worker sends message to Admin
res = requests.post("http://localhost:5000/api/worker/messages", json={"receiver_role": "admin", "content": "Hello Admin!"}, headers={"Authorization": f"Bearer {worker_token}"})
print("Worker -> Admin POST:", res.status_code, res.text)

# 4. Admin lists messages
res = requests.get("http://localhost:5000/api/admin/messages", headers={"Authorization": f"Bearer {admin_token}"})
print("Admin GET /api/admin/messages:", res.status_code, res.text)

# 5. Admin Broadcasts to Worker
res = requests.post("http://localhost:5000/api/admin/messages", json={"receiver_role": "worker", "content": "Hello all workers!"}, headers={"Authorization": f"Bearer {admin_token}"})
print("Admin -> Worker POST:", res.status_code, res.text)

# 6. Worker lists messages
res = requests.get("http://localhost:5000/api/worker/messages", headers={"Authorization": f"Bearer {worker_token}"})
print("Worker GET /api/worker/messages:", res.status_code, res.text)
