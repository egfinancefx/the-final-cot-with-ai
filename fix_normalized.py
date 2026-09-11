import sys

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Replace the bad AnimatePresence
content = content.replace('            </AnimatePresence>\n                </div>\n                <div className="flex-1 w-full">', '                </div>\n                <div className="flex-1 w-full">')

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
