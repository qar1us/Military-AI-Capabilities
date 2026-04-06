"""
Run this script once on your local machine to extract policy-data.json
from the original HTML file.

Usage: python3 extract-data.py path/to/your/dashboard.html
"""
import re, json, sys, os

if len(sys.argv) < 2:
    print("Usage: python3 extract-data.py <path-to-html-file>")
    sys.exit(1)

html_path = sys.argv[1]
out_path = os.path.join(os.path.dirname(html_path), "data", "policy-data.json")
os.makedirs(os.path.dirname(out_path), exist_ok=True)

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

match = re.search(r'<script id="policy-data" type="application/json">(.*?)</script>', html, re.DOTALL)
if not match:
    print("ERROR: Could not find policy data in HTML file.")
    sys.exit(1)

data = json.loads(match.group(1).strip())
with open(out_path, "w", encoding="utf-8") as out:
    json.dump(data, out, indent=2, ensure_ascii=False)

print(f"Success: wrote {out_path}")
print(f"  Countries: {len(data.get('countries', {}))}")
