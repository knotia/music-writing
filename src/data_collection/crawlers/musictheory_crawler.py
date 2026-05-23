import requests
from bs4 import BeautifulSoup
import json
import os
from urllib.parse import urlparse

class MusicTheoryCrawler:
    """
    MusicTheoryNet 등 웹 기반 음악 이론 교육 사이트에서 텍스트를 추출하는 크롤러입니다.
    """
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }

    def fetch_page_text(self, path: str) -> list[str]:
        """특정 경로의 페이지에서 단락(p 태그 등) 단위로 텍스트를 추출합니다."""
        url = f"{self.base_url}{path}"
        print(f"Crawling: {url}")
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 분석 문장이나 예제 설명을 포함할 가능성이 높은 태그 추출 (일반화된 규칙)
        paragraphs = soup.find_all(['p', 'li', 'div.lesson-text'])
        
        extracted_texts = []
        for p in paragraphs:
            text = p.get_text(strip=True)
            if len(text) > 20: # 너무 짧은 문구는 제외
                extracted_texts.append(text)
                
        return extracted_texts

    def save_raw_data(self, texts: list[str], output_path: str):
        """추출된 원시 텍스트를 JSON 형태로 임시 저장합니다."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        data = {
            "source": self.base_url,
            "raw_texts": texts
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Saved {len(texts)} raw texts to {output_path}")

if __name__ == "__main__":
    # 실행 예시 (실제 구조에 맞게 path 수정 필요)
    crawler = MusicTheoryCrawler("https://www.musictheory.net")
    # 예시: 레슨 페이지 접근 (musictheory.net의 실제 URL 구조 반영 필요)
    sample_texts = crawler.fetch_page_text("/lessons/20") 
    
    # 루트 폴더 기준으로 저장 경로 설정
    output_file = os.path.join("raw_data", "musictheory_raw.json")
    crawler.save_raw_data(sample_texts, output_file)
