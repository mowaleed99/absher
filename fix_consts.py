import os

files = [
    'lib/screens/home_screen.dart',
    'lib/screens/apartment_detail_screen.dart',
    'lib/screens/rent_flat_screen.dart',
    'lib/screens/notifications_screen.dart'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('const Row(', 'Row(')
    content = content.replace('const Column(', 'Column(')
    content = content.replace('const Center(', 'Center(')
    content = content.replace('const TextSpan(', 'TextSpan(')
    content = content.replace('const Expanded(', 'Expanded(')
    content = content.replace('const Padding(', 'Padding(')
    content = content.replace('const Align(', 'Align(')
    content = content.replace('const Stack(', 'Stack(')
    content = content.replace('const Positioned(', 'Positioned(')
    content = content.replace('const Container(', 'Container(')
    content = content.replace('const ListTile(', 'ListTile(')
    content = content.replace('const Drawer(', 'Drawer(')
    content = content.replace('const AppBar(', 'AppBar(')
    content = content.replace('const Scaffold(', 'Scaffold(')
    content = content.replace('const MaterialApp(', 'MaterialApp(')
    
    content = content.replace('\"${LanguageService.tr(\'auto_trans_1015\')}\"}', 'LanguageService.tr(\'auto_trans_1015\')}')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done fixing consts')
