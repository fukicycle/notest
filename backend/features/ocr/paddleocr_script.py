#!/usr/bin/env python3
"""
PaddleOCR wrapper script for Go application
"""
import sys
import json
from paddleocr import PaddleOCR

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    try:
        # Initialize PaddleOCR
        # use_angle_cls=True enables text direction detection
        # lang='japan' for Japanese, 'en' for English
        ocr = PaddleOCR(use_angle_cls=True, lang='japan', show_log=False)
        
        # Perform OCR
        result = ocr.ocr(image_path, cls=True)
        
        if not result or not result[0]:
            print(json.dumps({"text": "", "error": None}))
            sys.exit(0)
        
        # Extract text from results
        texts = []
        for line in result[0]:
            if line and len(line) > 1:
                texts.append(line[1][0])  # line[1][0] contains the text
        
        extracted_text = "\n".join(texts)
        
        # Return result as JSON
        print(json.dumps({"text": extracted_text, "error": None}))
        
    except Exception as e:
        print(json.dumps({"error": str(e), "text": ""}))
        sys.exit(1)

if __name__ == "__main__":
    main()
