import sys

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

if 'from "motion/react"' not in content:
    content = 'import { motion, AnimatePresence } from "motion/react";\n' + content
else:
    if 'AnimatePresence' not in content[:200]:
        content = content.replace('import { motion } from "motion/react";', 'import { motion, AnimatePresence } from "motion/react";')

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
