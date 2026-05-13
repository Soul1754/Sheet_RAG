import requests
import io

url = "http://localhost:8002/upload-paper"
files = [
    ('files', ('test.pdf', b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\n', 'application/pdf'))
]

response = requests.post(url, files=files)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
