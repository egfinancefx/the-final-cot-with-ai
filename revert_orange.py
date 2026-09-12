import glob
import re

files = glob.glob('components/*.tsx') + ['App.tsx']
for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Text
    content = content.replace('text-orange-200', 'text-blue-100')
    content = content.replace('text-orange-300', 'text-blue-200')
    content = content.replace('text-orange-400', 'text-white')
    content = content.replace('text-orange-500', 'text-white')
    
    # Backgrounds
    content = content.replace('bg-orange-400', 'bg-white')
    content = content.replace('bg-orange-500', 'bg-white')
    content = content.replace('bg-orange-600', 'bg-blue-500')
    content = content.replace('bg-orange-800', 'bg-blue-800')
    content = content.replace('bg-orange-900', 'bg-blue-900')
    content = content.replace('bg-orange-950', 'bg-blue-950')
    
    # Borders
    content = content.replace('border-orange-300', 'border-blue-300')
    content = content.replace('border-orange-400', 'border-white')
    content = content.replace('border-orange-500', 'border-white')
    content = content.replace('border-orange-800', 'border-blue-800')
    
    # Gradients
    content = content.replace('to-orange-300', 'to-blue-300')
    content = content.replace('to-orange-400', 'to-white')
    content = content.replace('to-orange-500', 'to-blue-400')
    content = content.replace('to-orange-600', 'to-blue-500')
    content = content.replace('from-orange-400', 'from-white')
    
    # Rings
    content = content.replace('ring-orange-500', 'ring-white')
    
    # Shadow
    content = content.replace('shadow-orange-500', 'shadow-white')

    with open(file_path, 'w') as f:
        f.write(content)

print("Done")
