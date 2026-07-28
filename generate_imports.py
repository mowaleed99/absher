import os
import re

exports = {
    'state.js': ['appData', 'setAppData', 'API_URL', 'LOGIN_URL', 'adminToken', 'setAdminToken', 'currentLang', 'setCurrentLang'],
    'auth.js': ['checkAuth', 'authFetch', 'initAuthModule'],
    'ui.js': ['showToast', 'openModal', 'closeModal', 'resolveImgUrl', 'formatChatMediaUrl', 'isEmbeddableVideo', 'getEmbedUrl', 'initThemeToggle'],
    'router.js': ['switchTab', 'initNavigation'],
    'api.js': ['loadDashboardData'],
    'uploads.js': ['initUploadsModule', 'compressImageClientSide'],
    
    # Feature modules export init function
    'modules/apartments.js': ['initApartmentsModule', 'renderApartments'],
    'modules/services.js': ['initServicesModule', 'renderServices'],
    'modules/students.js': ['initStudentsModule', 'renderStudents'],
    'modules/dashboard.js': ['initDashboardModule', 'renderStats'],
    'modules/chats.js': ['initChatsModule', 'renderChats', 'renderWaThread', 'renderChatMessagesThread'],
    'modules/requests.js': ['initRequestsModule', 'renderRequests'],
    'modules/reviews.js': ['initReviewsModule', 'renderReviews'],
    'modules/districts.js': ['initDistrictsModule', 'renderDistricts'],
    'modules/universities.js': ['initUniversitiesModule', 'renderUniversities'],
    'modules/news.js': ['initNewsModule', 'renderNews'],
    'modules/notifications.js': ['initNotificationsModule', 'renderNotifications']
}

def get_imports_for_file(filepath):
    # read file content
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    imports = []
    # Count occurrences of exported variables
    for module_file, exported_vars in exports.items():
        if filepath.endswith(module_file.replace('/', '\\')):
            continue # don't import from self
        
        needed = []
        for var in exported_vars:
            # simple regex to check if variable is used
            # boundary \bvar\b
            if re.search(r'\b' + var + r'\b', content):
                needed.append(var)
        
        if needed:
            # figure out relative path
            if 'modules\\' in filepath and not 'modules/' in module_file:
                rel_path = '../' + module_file
            elif not 'modules\\' in filepath and 'modules/' in module_file:
                rel_path = './' + module_file
            elif 'modules\\' in filepath and 'modules/' in module_file:
                rel_path = './' + module_file.split('/')[-1]
            else:
                rel_path = './' + module_file
            
            imports.append(f"import {{ {', '.join(needed)} }} from '{rel_path}';")
            
    return '\n'.join(imports) + '\n\n'

print("Test generator loaded.")
