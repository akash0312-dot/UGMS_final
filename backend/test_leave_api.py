import requests
# Login as W001
res = requests.post("http://localhost:5000/api/auth/worker/login", json={"worker_code": "W001", "password": "abc@123"})
if res.status_code != 200:
    print("Login failed:", res.text)
else:
    token = res.json().get("access_token")
    # Submit leave
    r = requests.post("http://localhost:5000/api/worker/leaves", json={"date": "2026-03-26", "reason": "fever"}, headers={"Authorization": "Bearer " + token})
    print("Leave response:", r.status_code, r.text)

    # Fetch leaves
    r2 = requests.get("http://localhost:5000/api/worker/leaves", headers={"Authorization": "Bearer " + token})
    print("Fetch leaves:", r2.status_code, r2.text)
