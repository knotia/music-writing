import json
import os
import random

class DataFormatter:
    """
    수집된 원시 데이터를 templates/finetune_data.jsonl 형식으로 변환합니다.
    실제 서비스에서는 이 부분에 OpenAI API 등을 연동하여 원시 텍스트에서 
    사용자 입력(input)과 전문가 출력(output) 쌍을 생성하는 로직이 들어갑니다.
    """
    def __init__(self, template_path: str):
        self.template_path = template_path
        # 임시 에러 유형 및 사고 구조 리스트 (테스트용)
        self.error_types = ["none", "tone_confusion", "rhythm_error", "structure_ambiguity"]
        self.thinking_structures = ["sequential", "repetitive", "contrastive", "integrative"]

    def process_raw_file(self, raw_file_path: str, output_jsonl_path: str):
        if not os.path.exists(raw_file_path):
            print(f"Raw data file not found: {raw_file_path}")
            return
            
        with open(raw_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        source = data.get("source", "unknown")
        raw_texts = data.get("raw_texts", [])
        
        formatted_data = []
        for text in raw_texts:
            # TODO: LLM 연동 후, text 기반으로 input, output 자동 생성
            # 현재는 더미 데이터를 이용해 변환 파이프라인만 구축
            input_text = f"[Simulated Input] 이 곡의 느낌은... (Raw: {text[:20]}...)"
            output_text = f"[Expert Translation] 사용자의 사고는 다음과 같이 해석됩니다: {text}"
            
            entry = {
                "input": input_text,
                "output": output_text,
                "metadata": {
                    "error_type": random.choice(self.error_types),
                    "thinking_structure": random.choice(self.thinking_structures),
                    "source": source
                }
            }
            formatted_data.append(entry)
            
        # JSONL로 저장
        os.makedirs(os.path.dirname(output_jsonl_path), exist_ok=True)
        with open(output_jsonl_path, 'w', encoding='utf-8') as f:
            for item in formatted_data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
                
        print(f"Formatted {len(formatted_data)} records to {output_jsonl_path}")

if __name__ == "__main__":
    formatter = DataFormatter("../../templates/finetune_data.jsonl")
    
    # 예시 실행 (앞서 만든 크롤러의 결과물이 있다고 가정)
    raw_path = os.path.join("raw_data", "musictheory_raw.json")
    out_path = os.path.join("processed_data", "finetune_dataset.jsonl")
    
    if os.path.exists(raw_path):
        formatter.process_raw_file(raw_path, out_path)
    else:
        print(f"No raw data found at {raw_path}. Run crawlers first.")
