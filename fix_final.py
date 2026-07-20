import json
import re

# 1. Fix index.html
with open('backend_php/admin/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace:
# <span><i class="fa-solid fa-comments" style="color: #25D366;"></i> المحادثات النشطة (<span
#         id="chatsCounter">3</span>)</span>
# With:
# <span><i class="fa-solid fa-comments" style="color: #25D366;"></i> <span>المحادثات النشطة</span> (<span
#         id="chatsCounter">3</span>)</span>

# We will use regex to be safe about whitespace
html = re.sub(r'</i>\s*المحادثات النشطة\s*\(<span', r'</i> <span>المحادثات النشطة</span> (<span', html)

with open('backend_php/admin/index.html', 'w', encoding='utf-8') as f:
    f.write(html)


# 2. Add 'المدير العام' to lang.js
with open('backend_php/admin/lang.js', 'r', encoding='utf-8') as f:
    js = f.read()

match = re.search(r'const translations = (\{.*?\});\n\nlet currentLang', js, re.DOTALL)
if match:
    json_str = match.group(1)
    data = json.loads(json_str)

    data['ar']['general_manager'] = 'المدير العام'
    data['en']['general_manager'] = 'General Manager'
    
    # What about 'PRO ADMIN'? That's english already.
    # What about 'متصل (المحاكاة نشطة)'?
    data['ar']['server_online'] = 'متصل (المحاكاة نشطة)'
    data['en']['server_online'] = 'Online (Simulation Active)'
    
    # Let's add the subtext for chats:
    data['ar']['chats_subtext'] = 'يتم ترتيب المحادثات عمودياً بأحدث وقت لسرعة الاستجابة لاستفسارات الطلاب وحجوزاتهم'
    data['en']['chats_subtext'] = 'Chats are arranged vertically by latest time for direct and quick response to student inquiries and bookings'

    new_json_str = json.dumps(data, ensure_ascii=False, indent=4)
    new_js = js.replace(json_str, new_json_str)

    with open('backend_php/admin/lang.js', 'w', encoding='utf-8') as f:
        f.write(new_js)
    
print('Finished fixing index.html and lang.js!')
