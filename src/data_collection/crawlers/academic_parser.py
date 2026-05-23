import os
import json
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

class AcademicParser:
    """
    Stanford Music Theory Course Notes 또는 Oxford Handbook 등의 PDF/텍스트 학술 자료를 파싱합니다.
    """
    def __init__(self, data_dir: str):
        self.data_dir = data_dir

    def parse_pdf(self, file_path: str) -> list[str]:
        """PDF 파일에서 페이지별로 텍스트를 추출합니다."""
        if fitz is None:
            print("PyMuPDF(fitz) 라이브러리가 설치되어 있지 않습니다. 'pip install PyMuPDF'를 실행하세요.")
            return []

        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return []

        extracted_texts = []
        try:
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text("text")
                # 간단한 문단 분리 (줄바꿈 연속 2번 이상을 기준으로 분리)
                paragraphs = [p.strip() for p in text.split('\n\n') if len(p.strip()) > 30]
                extracted_texts.extend(paragraphs)
            doc.close()
        except Exception as e:
            print(f"Error parsing PDF {file_path}: {e}")
            
        return extracted_texts

    def parse_text_file(self, file_path: str) -> list[str]:
        """일반 텍스트 파일(.txt)을 파싱합니다."""
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return []

        extracted_texts = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                paragraphs = [p.strip() for p in content.split('\n\n') if len(p.strip()) > 30]
                extracted_texts.extend(paragraphs)
        except Exception as e:
            print(f"Error reading text file {file_path}: {e}")
            
        return extracted_texts

    def save_raw_data(self, texts: list[str], source_name: str, output_path: str):
        """추출된 원시 데이터를 저장합니다."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        data = {
            "source": source_name,
            "raw_texts": texts
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Saved {len(texts)} academic raw texts to {output_path}")

if __name__ == "__main__":
    parser = AcademicParser("./data")
    # 예시: parser.parse_pdf("sample_course_notes.pdf")
    pass
