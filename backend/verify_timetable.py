import asyncio
from httpx import AsyncClient
from PIL import Image, ImageDraw
import io

def create_timetable_image():
    img = Image.new('RGB', (800, 400), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    
    # Draw some grid lines
    d.rectangle([50, 50, 750, 350], outline="black")
    
    # Add text simulating a timetable
    d.text((100, 100), "Monday: Data Structures (CS301)", fill="black")
    d.text((100, 150), "Tuesday: Machine Learning (CS405)", fill="black")
    d.text((100, 200), "Wednesday: Operating Systems (CS305)", fill="black")
    d.text((100, 250), "Thursday: Data Structures (CS301) Lab", fill="black")
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return buf.getvalue()

async def main():
    print("Generating timetable image...")
    img_bytes = create_timetable_image()
    
    print("Sending to API on port 8000...")
    
    import os
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from app.core.security import create_access_token
    from supabase import create_client
    from dotenv import load_dotenv
    load_dotenv()
    
    supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    user_res = supabase.table("users").select("id").limit(1).execute()
    if not user_res.data:
        print("No users found in database.")
        return
    real_user_id = user_res.data[0]["id"]
    
    token = create_access_token(user_id=real_user_id, email="test@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    files = {"file": ("timetable.jpg", img_bytes, "image/jpeg")}
    
    async with AsyncClient() as client:
        try:
            response = await client.post("http://localhost:8002/api/v1/intelligence/upload/timetable", files=files, headers=headers, timeout=60.0)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
