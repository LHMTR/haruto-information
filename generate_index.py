import os, json

JSON_DIR = 'information-json'
INDEX_FILE = os.path.join(JSON_DIR, 'index.json')
EXCLUDE = ['index.json']

def generate_index():
    lines = []
    for f in os.listdir(JSON_DIR):
        if not f.endswith('.json') or f in EXCLUDE: continue
        with open(os.path.join(JSON_DIR, f), encoding='utf-8') as fp:
            data = json.load(fp)
        required = ['line_code','line_name','destination','company_code',
                    'company','service_type','service','color','service_color','builder']
        if not all(k in data for k in required):
            print(f'跳过 {f}：缺少必要字段')
            continue
        lines.append({k: data[k] for k in required})
    lines.sort(key=lambda x: x['line_code'])
    with open(INDEX_FILE, 'w', encoding='utf-8') as fp:
        json.dump(lines, fp, ensure_ascii=False, indent=2)
    print(f'已生成 {INDEX_FILE}，共 {len(lines)} 条线路')

if __name__ == '__main__':
    generate_index()