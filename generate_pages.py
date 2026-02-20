import os
import json

INDEX_FILE = 'information/index.json'   # 汇总文件路径
OUTPUT_DIR = 'pages'
TEMPLATE = os.path.join(OUTPUT_DIR, 'template.html')

def generate_pages():
    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        lines = json.load(f)

    with open(TEMPLATE, 'r', encoding='utf-8') as f:
        template = f.read()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for line in lines:
        code = line.get('line_code')
        if not code:
            print(f"警告：线路缺少 line_code，跳过：{line}")
            continue
        out = os.path.join(OUTPUT_DIR, f"{code}.html")
        with open(out, 'w', encoding='utf-8') as f:
            f.write(template)
        print(f"生成 {out}")

    print("所有详情页生成完成！")

if __name__ == '__main__':
    generate_pages()
