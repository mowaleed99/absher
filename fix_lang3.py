import json

with open('backend_php/admin/lang.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re
match = re.search(r'const translations = (\{.*?\});\n\nlet currentLang', content, re.DOTALL)
if match:
    json_str = match.group(1)
    data = json.loads(json_str)

    additions = {
        'absher_logo': ('أبشر', 'Absher'),
        'customer_service_absher': ('خدمة العملاء (أبشر)', 'Customer Service (Absher)'),
        'new_request_badge': ('طلب جديد', 'New Request'),
        'chat_input_placeholder': ('اكتب رسالتك و ردك على استفسار وحجز الطالب هنا...', 'Type your message and reply to student inquiry here...'),
    }

    for k, (ar_val, en_val) in additions.items():
        data['ar'][k] = ar_val
        data['en'][k] = en_val

    new_json_str = json.dumps(data, ensure_ascii=False, indent=4)
    new_content = content.replace(json_str, new_json_str)

    with open('backend_php/admin/lang.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Added chat strings to lang.js!')
else:
    print('Could not parse lang.js JSON')
