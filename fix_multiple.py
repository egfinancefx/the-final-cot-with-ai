import sys

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Replace multiple with single
while '            <AnimatePresence mode="wait">\n            <AnimatePresence mode="wait">' in content:
    content = content.replace('            <AnimatePresence mode="wait">\n            <AnimatePresence mode="wait">', '            <AnimatePresence mode="wait">')

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
