import asyncio
from supabase import create_client, Client
import os
from dotenv import load_dotenv
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

try:
    res = supabase.table("attendance_records").select("*").limit(1).execute()
    print(res)
except Exception as e:
    print(f"Error: {e}")
