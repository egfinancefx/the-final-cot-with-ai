import sys

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Add motion import if not present
if 'import { motion } from "motion/react";' not in content:
    content = content.replace("import React,", 'import { motion } from "motion/react";\nimport React,')

def apply_motion_wrapper(content, marker, delay):
    start_idx = content.find(marker)
    if start_idx == -1: return content
    
    # find the very next `<div`
    div_idx = content.find("<div", start_idx)
    if div_idx == -1: return content
    
    # replace `<div` with `<motion.div` and add props
    motion_props = f'<motion.div\n            initial={{{{ opacity: 0, y: 20 }}}}\n            animate={{{{ opacity: 1, y: 0 }}}}\n            transition={{{{ duration: 0.8, delay: {delay}, ease: [0.16, 1, 0.3, 1] }}}}'
    content = content[:div_idx] + motion_props + content[div_idx+4:]
    
    # Track depth to find closing tag
    # Start looking for tags right after the inserted motion_props
    current_idx = div_idx + len(motion_props)
    depth = 1
    
    while depth > 0 and current_idx < len(content):
        next_open = content.find("<div", current_idx)
        next_close = content.find("</div", current_idx)
        
        # motion.div tags also need to be considered if there are any inside, 
        # but they start with `<motion.div` and end with `</motion.div` 
        # Actually `<div` matches `<div` but `</div` matches `</div` and `</motion.div`.
        
        if next_open != -1 and next_open < next_close:
            depth += 1
            current_idx = next_open + 4
        elif next_close != -1:
            depth -= 1
            current_idx = next_close + 5
            if depth == 0:
                # Replace the matched `</div` with `</motion.div`
                content = content[:next_close] + "</motion.div" + content[next_close+5:]
                break
        else:
            break
            
    return content

# The order is currently:
# TV Charts (0.1s)
# Section 3 (0.2s)
# Section 1 (0.3s)
# Section 2 (0.4s)
# Section 4 (0.5s)

content = apply_motion_wrapper(content, "{/* TradingView Charts Grid", 0.1)
content = apply_motion_wrapper(content, "{/* 3. Advanced Comparison Charts Section */}", 0.2)
content = apply_motion_wrapper(content, "{/* 1. The Core Institutional Verdict", 0.3)
content = apply_motion_wrapper(content, "{/* 2. Side-by-Side Deep Institutional", 0.4)
content = apply_motion_wrapper(content, "{/* 4. Comprehensive Comparison Matrix", 0.5)

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
