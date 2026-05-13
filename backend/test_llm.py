from llama_index.llms.nvidia import NVIDIA
from dotenv import load_dotenv
import os
import time

load_dotenv()

api_key = os.getenv("NVIDIA_API_KEY")
model = os.getenv("NVIDIA_LLM_MODEL", "meta/llama-3.2-3b-instruct")

if not api_key:
    raise SystemExit("NVIDIA_API_KEY is missing. Set it in your .env file.")

print(f"Testing NVIDIA LLM: {model}")
start = time.time()
try:
    llm = NVIDIA(model=model, api_key=api_key)
    response = llm.complete("Reply with: OK")
    elapsed = time.time() - start
    print("SUCCESS")
    print(f"Latency: {elapsed:.2f}s")
    print(f"Response: {response}")
except Exception as exc:
    elapsed = time.time() - start
    print("FAILED")
    print(f"Latency: {elapsed:.2f}s")
    print(f"Error: {exc}")
