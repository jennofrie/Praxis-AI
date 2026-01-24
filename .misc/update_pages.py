import os
import re

design_dir = ".designs"
files = {
    "dashboard.html": "Dashboard",
    "participants.html": "Participants",
    "reports.html": "Reports & Docs",
    "ai.html": "AI Assistant",
    "toolkit.html": "Toolkit",
    "ndisplans.html": "NDIS Plans",
    "general.html": "General",
    "profile.html": "Profile" 
}

# Standard Dashboard Sidebar Template (with placeholders for active states)
def get_sidebar(active_page):
    
    def link_class(page_name):
        base = "flex items-center gap-3 px-2 py-2.5 rounded-DEFAULT transition-colors group"
        if page_name == active_page:
            return f"{base} bg-primary/10 text-primary"
        else:
            return f"{base} text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white"

    def icon_class(page_name):
        base = "material-icons-round text-[20px] transition-colors"
        if page_name == active_page:
            return base # Inherits text color
        else:
            return f"{base} group-hover:text-primary"

    return f"""<aside class="w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col h-full flex-shrink-0 z-20">
    <div class="h-16 flex items-center px-6 border-b border-border-light dark:border-border-dark lg:border-none">
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <span class="material-icons-round text-xl">all_inclusive</span>
            </div>
            <span class="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Quantum</span>
        </div>
    </div>
    <div class="px-5 mt-4 mb-2">
        <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="material-icons-round text-gray-400 text-sm">search</span>
            </span>
            <input class="w-full bg-gray-50 dark:bg-slate-700/50 border-none rounded-lg py-2 pl-9 pr-3 text-sm text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary placeholder-gray-400 dark:placeholder-slate-500" placeholder="Search data..." type="text"/>
            <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <span class="text-gray-400 text-xs border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5">⌘K</span>
            </div>
        </div>
    </div>
    <nav class="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div>
            <h3 class="px-2 text-xs font-semibold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider mb-2">Clinical Workflow</h3>
            <ul class="space-y-1">
                <li>
                    <a class="{link_class('Dashboard')}" href="dashboard.html">
                        <span class="{icon_class('Dashboard')}">dashboard</span>
                        <span class="font-medium text-sm">Dashboard</span>
                    </a>
                </li>
                <li>
                    <a class="{link_class('Participants')}" href="participants.html">
                        <span class="{icon_class('Participants')}">people</span>
                        <span class="font-medium text-sm">Participants</span>
                    </a>
                </li>
                <li>
                    <a class="{link_class('Reports & Docs')}" href="reports.html">
                        <span class="{icon_class('Reports & Docs')}">assignment</span>
                        <span class="font-medium text-sm">Reports & Docs</span>
                    </a>
                </li>
                <li>
                    <a class="{link_class('AI Assistant')}" href="ai.html">
                        <span class="{icon_class('AI Assistant')}">psychology</span>
                        <span class="font-medium text-sm">AI Assistant</span>
                        <span class="ml-auto bg-indigo-100 dark:bg-indigo-900/40 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
                    </a>
                </li>
                <li>
                    <a class="{link_class('Toolkit')}" href="toolkit.html">
                        <span class="{icon_class('Toolkit')}">construction</span>
                        <span class="font-medium text-sm">Toolkit</span>
                    </a>
                </li>
            </ul>
        </div>
        <div>
            <h3 class="px-2 text-xs font-semibold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider mb-2">Compliance</h3>
            <ul class="space-y-1">
                <li>
                    <a class="{link_class('Audits')}" href="#">
                        <span class="{icon_class('Audits')}">verified_user</span>
                        <span class="font-medium text-sm">Audits</span>
                    </a>
                </li>
                <li>
                    <a class="{link_class('NDIS Plans')}" href="ndisplans.html">
                        <span class="{icon_class('NDIS Plans')}">history_edu</span>
                        <span class="font-medium text-sm">NDIS Plans</span>
                    </a>
                </li>
            </ul>
        </div>
        <div>
            <h3 class="px-2 text-xs font-semibold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider mb-2">Settings</h3>
            <ul class="space-y-1">
                <li>
                    <a class="{link_class('General')}" href="general.html">
                        <span class="{icon_class('General')}">settings</span>
                        <span class="font-medium text-sm">General</span>
                    </a>
                </li>
                <li>
                    <a class="{link_class('Help Center')}" href="#">
                        <span class="{icon_class('Help Center')}">help_outline</span>
                        <span class="font-medium text-sm">Help Center</span>
                    </a>
                </li>
            </ul>
        </div>
    </nav>
    <div class="p-4 border-t border-border-light dark:border-border-dark">
        <a href="profile.html" class="flex items-center gap-3 w-full hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
            <img alt="User avatar" class="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3PRJomuYWo10PIj-wZ4oATztLJHU09M0yzJNrEj9PExcDf5irhFSknCmiKVhIpHuE4326mJFaMwoiucPKgNbVWJYxfzdkmyA-t4lIl6dIWQMk6zReuWABMGjJb68EgIVNIwi_wIUQVkBLhK3I9Gt-mQSt3N1NR1couViFXGZXp6c9r1JSV1qz03QqNMe4LrKh9goVNRi7QBvro3HK6SDVnBkcQwmT3-bgiNqy6TS7PRK8rgX7QlIiZMYr0io3FhCbpUqj8sqRCIs"/>
            <div class="text-left">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Sarah Chen</p>
                <p class="text-xs text-text-sub-light dark:text-text-sub-dark">Senior OT</p>
            </div>
        </a>
    </div>
</aside>"""

for filename, page_name in files.items():
    filepath = os.path.join(design_dir, filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename}, does not exist")
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Sidebar
    new_sidebar = get_sidebar(page_name)
    # Regex to find <aside ...> ... </aside>. Using dotall to match newlines.
    # We look for <aside ...> and end with </aside>
    # Note: simple regex might fail if nested asides (unlikely here) or attributes differ wildly.
    # The existing asides might have different classes.
    
    # Pattern: <aside (any attributes)>(content)</aside>
    pattern = re.compile(r'<aside.*?>.*?</aside>', re.DOTALL)
    
    if pattern.search(content):
        content = pattern.sub(new_sidebar, content, count=1)
        print(f"Updated sidebar in {filename}")
    else:
        print(f"Warning: No aside tag found in {filename}")

    # 2. Ensure Material Icons Round is linked
    icon_link = '<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet"/>'
    if 'family=Material+Icons+Round' not in content:
        # Insert before </head>
        content = content.replace('</head>', f'{icon_link}\n</head>')
        print(f"Added Material Icons link to {filename}")

    # 3. Ensure Tailwind configuration consistency if needed (Dashboard has specific colors)
    # Ideally, we should check if they all have the same tailwind config.
    # Dashboard has a custom config block.
    # If a file is missing the custom config, it might look wrong.
    # Checking for "tailwind.config ="
    if "tailwind.config =" not in content and filename != "dashboard.html":
        # We might want to inject the dashboard's config. 
        # But let's assume for now the user wants to keep existing page styles but just fix nav.
        # Although "make these images real" implies consistency.
        # I'll stick to the sidebar instructions for now to avoid breaking existing specific page designs.
        pass

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("All files processed.")
