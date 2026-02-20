import os
import json

INPUT_DIR = 'information'                # 原始JSON存放目录（与需求一致）
OUTPUT_FILE = 'information/index.json'   # 生成的汇总文件路径
EXCLUDE = ['index.json']

def generate_index():
    # 检查输入目录是否存在
    if not os.path.exists(INPUT_DIR):
        os.makedirs(INPUT_DIR)
        print(f"创建目录 {INPUT_DIR}，但其中没有JSON文件。")
        # 如果目录为空，后续不会生成任何线路，但可以继续（输出空数组）
    
    lines = []
    for f in os.listdir(INPUT_DIR):
        if not f.endswith('.json') or f in EXCLUDE:
            continue
        filepath = os.path.join(INPUT_DIR, f)
        try:
            with open(filepath, 'r', encoding='utf-8') as fp:
                data = json.load(fp)
        except json.JSONDecodeError as e:
            print(f"❌ JSON 格式错误在文件 {f}: {e}")
            raise
        except Exception as e:
            print(f"读取文件 {f} 失败：{e}")
            continue

        # 提取首页所需字段（包括可选字段）
        required = ['line_code', 'line_name', 'destination', 'company_code',
                    'company', 'service_type', 'service', 'line_color_1', 'service_color', 'builder', 'train']
        entry = {}
        for field in required:
            if field in data:
                entry[field] = data[field]
        if 'line_code' not in entry:
            print(f"跳过 {f}：缺少 line_code")
            continue
        lines.append(entry)

    lines.sort(key=lambda x: x['line_code'])

    # 确保输出目录存在
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as fp:
        json.dump(lines, fp, ensure_ascii=False, indent=2)
    print(f"✅ 已生成 {OUTPUT_FILE}，共 {len(lines)} 条线路。")

if __name__ == '__main__':
    generate_index()
