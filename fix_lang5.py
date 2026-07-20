import json

with open('backend_php/admin/lang.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re
match = re.search(r'const translations = (\{.*?\});\n\nlet currentLang', content, re.DOTALL)
if match:
    json_str = match.group(1)
    data = json.loads(json_str)

    additions = {
        'status_new_req_yellow': ('طلب جديد 🟡', 'New Request 🟡'),
        'status_new_msg_green': ('رسالة جديدة 🟢', 'New Message 🟢'),
        'status_replied_check': ('تم الرد ✔️', 'Replied ✔️'),
        'status_completed': ('مكتمل', 'Completed'),
        'status_under_review': ('قيد المراجعة', 'Under Review'),
        'status_in_progress': ('جاري التنفيذ', 'In Progress'),
        'live_status': ('Live', 'Live')
    }

    for k, (ar_val, en_val) in additions.items():
        data['ar'][k] = ar_val
        data['en'][k] = en_val

    new_json_str = json.dumps(data, ensure_ascii=False, indent=4)
    new_content = content.replace(json_str, new_json_str)

    with open('backend_php/admin/lang.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Added database dynamic statuses to lang.js!')
else:
    print('Could not parse lang.js JSON')
