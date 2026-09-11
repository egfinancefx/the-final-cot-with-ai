import sys
import re

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Make sure imports are right
if 'import { motion, AnimatePresence }' not in content:
    content = content.replace('import { motion } from "motion/react";', 'import { motion, AnimatePresence } from "motion/react";')

def fix_view(content, view_name):
    # Find the start of the view block
    start_str = f"{{chartView === '{view_name}' && ("
    start_idx = content.find(start_str)
    if start_idx == -1: return content
    
    # Check if it has a motion.div
    div_idx = content.find("<div", start_idx)
    motion_div_idx = content.find("<motion.div", start_idx)
    
    if motion_div_idx != -1 and motion_div_idx < div_idx:
        # It's already a motion.div
        # we need to ensure it has key and AnimatePresence properties
        pass
    
    return content

# actually, let's just do a manual string replacement for each one.
def patch_section(content, name, old_start, new_start):
    # We replace the opening div
    content = re.sub(rf"{{chartView === '{name}' && \(\s*<(?:motion\.)?div[^>]*>", new_start, content, count=1)
    return content

content = patch_section(content, 'normalized', r"{chartView === 'normalized' && (", """{chartView === 'normalized' && (
              <motion.div
                key="normalized"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full h-full flex flex-col"
              >""")

content = patch_section(content, 'historical', r"{chartView === 'historical' && (", """{chartView === 'historical' && (
              <motion.div
                key="historical"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full h-full flex flex-col"
              >""")

content = patch_section(content, 'radar', r"{chartView === 'radar' && (", """{chartView === 'radar' && (
              <motion.div
                key="radar"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full flex flex-col items-center justify-center relative"
              >""")

content = patch_section(content, 'delta', r"{chartView === 'delta' && (", """{chartView === 'delta' && (
              <motion.div
                key="delta"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full h-full flex flex-col"
              >""")

# Now replace the closing tags of these sections to be </motion.div>
# Since there could be other divs, we look for:
#               </div>
#             )}
# and replace with:
#               </motion.div>
#             )}
content = content.replace("              </div>\n            )}", "              </motion.div>\n            )}")

# Ensure AnimatePresence wraps the views
content = content.replace('<div className="h-[380px] w-full">', '<div className="h-[380px] w-full">\n            <AnimatePresence mode="wait">')

# The end of the chart views block
content = content.replace("""              </motion.div>
            )}
          </div>""", """              </motion.div>
            )}
            </AnimatePresence>
          </div>""")

# Also fix the weird </AnimatePresence> that was left over
content = content.replace("            </AnimatePresence>\n            </AnimatePresence>", "            </AnimatePresence>")

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)

