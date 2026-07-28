import os

with open('backend_php/admin/js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_lines(start, end):
    return lines[start-1:end]

os.makedirs('backend_php/admin/js/modules', exist_ok=True)

# Based on line numbers from app.js (which has 2023 lines)
files = {
    'backend_php/admin/js/state.js': get_lines(1, 5) + get_lines(115, 127),
    'backend_php/admin/js/auth.js': get_lines(6, 63),
    'backend_php/admin/js/ui.js': get_lines(64, 114) + get_lines(183, 195) + get_lines(229, 235) + get_lines(552, 564) + get_lines(1701, 1710) + get_lines(1900, 1945),
    'backend_php/admin/js/router.js': get_lines(138, 182),
    'backend_php/admin/js/api.js': get_lines(196, 228) + get_lines(1170, 1190),
    'backend_php/admin/js/modules/dashboard.js': get_lines(236, 267),
    'backend_php/admin/js/modules/apartments.js': get_lines(268, 320) + get_lines(849, 929) + get_lines(972, 992),
    'backend_php/admin/js/modules/services.js': get_lines(321, 342) + get_lines(930, 971) + get_lines(993, 1014),
    'backend_php/admin/js/modules/students.js': get_lines(447, 469) + get_lines(565, 660),
    'backend_php/admin/js/modules/universities.js': get_lines(1015, 1096),
    'backend_php/admin/js/modules/districts.js': get_lines(1097, 1169),
    'backend_php/admin/js/modules/chats.js': get_lines(470, 518) + get_lines(1191, 1700),
    # Wait, requests logic! I missed it in the file names, but user didn't mention it. I will add it to dashboard or its own file.
    'backend_php/admin/js/modules/requests.js': get_lines(343, 446),
    'backend_php/admin/js/modules/reviews.js': get_lines(519, 547),
    'backend_php/admin/js/uploads.js': get_lines(671, 848),
    'backend_php/admin/js/modules/news.js': get_lines(1711, 1800),
    'backend_php/admin/js/modules/notifications.js': get_lines(1801, 1899),
    'backend_php/admin/js/app.js': get_lines(128, 137) # The init logic
}

for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(content)

print("Split completed successfully!")
