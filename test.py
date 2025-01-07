import json
from pathlib import Path

json_path = Path('frontend/public/analysis_results.json')
if json_path.exists():
    with open(json_path) as f:
        data = json.load(f)
    print("File exists and contains:", list(data.keys()))
    if 'airlinePerformance' in data:
        print("\nFirst airline:", data['airlinePerformance'][0])
else:
    print("JSON file not found!")