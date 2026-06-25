import sys
sys.path.insert(0, '.')

def test_ai():
    try:
        from app.services.intelligence_engine import AcademicIntelligenceEngine
        from app.schemas.intelligence import IntelligenceRequest
        engine = AcademicIntelligenceEngine()
        req = IntelligenceRequest(input_type="notice", data={"text": "CS101 Final Exam on 2026-07-15 at Room 4B."})
        res = engine.process_notice(req)
        print("[SUCCESS] AI Engine Success!")
        print("Extracted Events:", [e.title for e in res.extracted_events])
        print("Risk Score:", res.risk_assessment.risk_score)
    except Exception as e:
        print("[FAIL] AI Engine Failed:", str(e))

def test_make():
    try:
        from app.integrations.make import MakeClient
        client = MakeClient()
        res = client.send_whatsapp("notice", {
            "user_id": "test-uuid",
            "log_id": "test-log-uuid",
            "whatsapp_number": "+919431703182",
            "message": "This is a test message from CampusFlow Backend verification script!"
        })
        print("[SUCCESS] Make.com Webhook Success:", res)
    except Exception as e:
        print("[FAIL] Make.com Webhook Failed:", str(e))

if __name__ == "__main__":
    print("Testing flows with user-provided .env variables...")
    test_ai()
    print("-" * 40)
    test_make()
