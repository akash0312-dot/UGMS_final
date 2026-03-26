import requests

res = requests.post("http://localhost:5000/api/auth/worker/login", json={"worker_code": "HR001", "password": "hr001pass"})
print("Login:", res.status_code, res.text)

token = res.json().get("access_token")

res2 = requests.post(f"http://localhost:5000/api/hr/attendance", json={"worker_code": "W001", "status": "Present"}, headers={"Authorization": f"Bearer {token}"})
print("Attendance:", res2.status_code, res2.text)

res3 = requests.put(f"http://localhost:5000/api/hr/workers/W001/salary", json={"salary": 20000}, headers={"Authorization": f"Bearer {token}"})
print("Salary:", res3.status_code, res3.text)
