import os
import json
from collections import OrderedDict

JSON_DIR = 'information-json'
INDEX_FILE = os.path.join(JSON_DIR, 'index.json')
OUTPUT_DIR = 'pages'
TEMPLATE = os.path.join(OUTPUT_DIR, 'template.html')

def generate_pages():
    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        lines = json.load(f, object_pairs_hook=OrderedDict)

    with open(TEMPLATE, 'r', encoding='utf-8') as f:
        template = f.read()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for line in lines:
        code = line.get('line_code')
        if not code:
            continue
        out = os.path.join(OUTPUT_DIR, f"{code}.html")
        with open(out, 'w', encoding='utf-8') as f:
            f.write(template)
        print(f"生成 {out}")

    print("所有详情页生成完成！")

if __name__ == '__main__':
    generate_pages()
