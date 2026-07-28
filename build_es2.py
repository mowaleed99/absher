import os
import re

exports = {
    'state.js': ['appData', 'setAppData', 'API_URL', 'LOGIN_URL', 'adminToken', 'setAdminToken', 'currentLang', 'setCurrentLang'],
    'auth.js': ['checkAuth', 'authFetch', 'initAuthModule'],
    'ui.js': ['showToast', 'openModal', 'closeModal', 'resolveImgUrl', 'formatChatMediaUrl', 'isEmbeddableVideo', 'getEmbedUrl', 'initThemeToggle'],
    'router.js': ['switchTab', 'initNavigation'],
    'api.js': ['loadDashboardData'],
    'uploads.js': ['initUploadsModule', 'compressImageClientSide'],
    'modules/dashboard.js': ['initDashboardModule', 'renderStats'],
    'modules/apartments.js': ['initApartmentsModule', 'renderApartments', 'handleAddApartment', 'deleteApartment'],
    'modules/services.js': ['initServicesModule', 'renderServices'],
    'modules/students.js': ['initStudentsModule', 'renderStudents'],
    'modules/chats.js': ['initChatsModule', 'renderChats', 'renderWaThread', 'renderChatMessagesThread'],
    'modules/requests.js': ['initRequestsModule', 'renderRequests'],
    'modules/reviews.js': ['initReviewsModule', 'renderReviews'],
    'modules/districts.js': ['initDistrictsModule', 'renderDistricts'],
    'modules/universities.js': ['initUniversitiesModule', 'renderUniversities'],
    'modules/news.js': ['initNewsModule', 'renderNews'],
    'modules/notifications.js': ['initNotificationsModule', 'renderNotifications']
}

def get_imports(filepath, content):
    imports = []
    filepath = filepath.replace('\\', '/')
    for module_file, exported_vars in exports.items():
        if filepath.endswith(module_file): continue
        needed = []
        for var in exported_vars:
            if re.search(r'\b' + var + r'\b', content):
                needed.append(var)
        if needed:
            if 'modules/' in filepath and not 'modules/' in module_file:
                rel_path = '../' + module_file
            elif not 'modules/' in filepath and 'modules/' in module_file:
                rel_path = './' + module_file
            elif 'modules/' in filepath and 'modules/' in module_file:
                rel_path = './' + module_file.split('/')[-1]
            else:
                rel_path = './' + module_file
            imports.append(f"import {{ {', '.join(needed)} }} from '{rel_path}';")
    return '\n'.join(imports)

js_dir = 'backend_php/admin/js/'

# Add 'export ' to all function definitions
for root, dirs, files in os.walk(js_dir):
    for file in files:
        if file.endswith('.js') and file != 'app.js' and file != 'state.js':
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Export functions
            content = re.sub(r'^(async\s+function|function)\s+', r'export \1 ', content, flags=re.MULTILINE)
            
            # Re-read for imports
            imports = get_imports(filepath, content)
            final_content = imports + '\n\n' + content
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(final_content)

print("Export and imports added")
