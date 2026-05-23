import json
import os
from user_analysis import UserAnalysisRequest
from feedback import ExpertFeedback

def test_schemas():
    examples_path = os.path.join(os.path.dirname(__file__), "examples.json")
    
    with open(examples_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    user_data = data.get("user_analysis_request")
    feedback_data = data.get("expert_feedback")
    
    print("Testing UserAnalysisRequest schema...")
    try:
        user_request = UserAnalysisRequest(**user_data)
        print("✅ UserAnalysisRequest parsed successfully.")
        print(f"   -> Extracted Tone: {user_request.extracted_elements.tone_choice}")
    except Exception as e:
        print(f"❌ Error parsing UserAnalysisRequest: {e}")
        
    print("\nTesting ExpertFeedback schema...")
    try:
        feedback = ExpertFeedback(**feedback_data)
        print("✅ ExpertFeedback parsed successfully.")
        print(f"   -> Error Type: {feedback.logic_evaluation.error_type}")
        print(f"   -> Thinking Structure: {feedback.thinking_structure}")
    except Exception as e:
        print(f"❌ Error parsing ExpertFeedback: {e}")

if __name__ == "__main__":
    test_schemas()
