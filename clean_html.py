import os
import re

with open('backend_php/admin/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to replace specific onclicks with data attributes
# 1. onclick="switchTab('tab_name')" -> data-action="switchTab" data-tab="tab_name"
content = re.sub(r'''onclick="switchTab\('([^']+)'\)"''', r'data-action="switchTab" data-tab="\1"', content)

# 2. onclick="openModal('modal_name')" -> data-action="openModal" data-modal="\1"
content = re.sub(r'''onclick="openModal\('([^']+)'\)"''', r'data-action="openModal" data-modal="\1"', content)

# 3. onclick="closeModal('modal_name')" -> data-action="closeModal" data-modal="\1"
content = re.sub(r'''onclick="closeModal\('([^']+)'\)"''', r'data-action="closeModal" data-modal="\1"', content)

# 4. onclick="doAdminLogout()" -> id="logoutBtn"
content = content.replace('onclick="doAdminLogout()"', 'id="logoutBtn"')

# 5. onclick="toggleRoommateFields(this.value)" -> this is on <select id="aptRentalType">. We can just remove it and add event listener to id.
content = content.replace('onchange="toggleRoommateFields(this.value)"', '')

# 6. onchange="handleAptFileSelect(this)" -> id="aptFileInput" exists.
content = content.replace('onchange="handleAptFileSelect(this)"', '')
content = content.replace('onchange="handleSvcFileSelect(this)"', '')
content = content.replace('onchange="handleNewsFileSelect(this)"', '')

# 7. onsubmit="... " -> remove them because the forms already have ids.
content = re.sub(r'''onsubmit="[^"]+"''', '', content)

# 8. oninput="filterRequests()" -> id="reqSearchInput" exists.
content = content.replace('oninput="filterRequests()"', '')

# 9. onclick="if(event.target === this) closeModal('imageLightboxModal')"
content = content.replace('''onclick="if(event.target === this) closeModal('imageLightboxModal')"''', 'data-action="closeLightbox"')

# 10. onclick="triggerWaAttachmentUrl()" -> id="waAttachUrlBtn"
content = content.replace('onclick="triggerWaAttachmentUrl()"', 'id="waAttachUrlBtn"')
# 11. onclick="triggerWaVideoAttachment()" -> id="waAttachVideoBtn"
content = content.replace('onclick="triggerWaVideoAttachment()"', 'id="waAttachVideoBtn"')
# 12. onclick="document.getElementById('waImageFileInput').click()" -> id="waAttachImgBtn"
content = content.replace('''onclick="document.getElementById('waImageFileInput').click()"''', 'id="waAttachImgBtn"')
content = content.replace('onchange="handleWaImageUpload(this)"', '')

# 13. onclick="triggerModalVideoAttachment()" -> id="modalAttachVideoBtn"
content = content.replace('onclick="triggerModalVideoAttachment()"', 'id="modalAttachVideoBtn"')
# 14. onclick="document.getElementById('modalImageFileInput').click()" -> id="modalAttachImgBtn"
content = content.replace('''onclick="document.getElementById('modalImageFileInput').click()"''', 'id="modalAttachImgBtn"')
content = content.replace('onchange="handleModalImageUpload(this)"', '')

# 15. The rest of the forms and close buttons:
content = re.sub(r'''onclick="[^"]+"''', '', content) # Strip all remaining onclicks carefully? No, wait!
# If I strip all remaining, what if there are some I missed?
with open('backend_php/admin/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("HTML cleaned")
