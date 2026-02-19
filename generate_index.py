import os
import json

JSON_DIR = 'information-json'
INDEX_FILE = os.path.join(JSON_DIR, 'index.json')
EXCLUDE = ['index.json']

def generate_index():
    lines = []
    for f in os.listdir(JSON_DIR):
        if not f.endswith('.json') or f in EXCLUDE:
            continue
        filepath = os.path.join(JSON_DIR, f)
        try:
            with open(filepath, 'r', encoding='utf-8') as fp:
                data = json.load(fp)
        except json.JSONDecodeError as e:
            print(f"❌ JSON 格式错误在文件 {f}: {e}")
            print(f"   错误位置: 第 {e.lineno} 行, 第 {e.colno} 列 (字符 {e.pos})")
            # 抛出异常以终止工作流，或可注释掉下面一行以跳过此文件继续
            raise  # 终止执行，便于您看到错误后修复
            # continue  # 如果希望跳过错误文件，可改用 continue
        except Exception as e:
            print(f"读取文件 {f} 失败：{e}")
            continue

        required = ['line_code', 'line_name', 'destination', 'company_code',
                    'company', 'service_type', 'service', 'color', 'service_color', 'builder']
        if not all(k in data for k in required):
            print(f"跳过 {f}：缺少必要字段")
            continue

        lines.append({k: data[k] for k in required})

    lines.sort(key=lambda x: x['line_code'])

    with open(INDEX_FILE, 'w', encoding='utf-8') as fp:
        json.dump(lines, fp, ensure_ascii=False, indent=2)
    print(f"✅ 已生成 {INDEX_FILE}，共 {len(lines)} 条线路。")

if __name__ == '__main__':
    generate_index()
