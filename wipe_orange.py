import glob
import re

files = glob.glob('components/*.tsx') + ['App.tsx']
for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()

    # Skip CompareView.tsx for the asset colors
    if file_path != 'components/CompareView.tsx':
        content = content.replace('via-orange-400', 'via-white')
        content = content.replace('shadow-orange-400', 'shadow-white')
        content = content.replace('from-orange-500', 'from-blue-500')
        content = content.replace('to-orange-100', 'to-blue-100')
        content = content.replace('from-orange-600', 'from-blue-600')
        content = content.replace('text-orange-700', 'text-blue-700')
        content = content.replace('bg-orange-100', 'bg-blue-100')
        content = content.replace('text-orange-600', 'text-blue-600')
        content = content.replace('border-orange-200', 'border-blue-200')

    with open(file_path, 'w') as f:
        f.write(content)

print("Done wiping stray orange")
