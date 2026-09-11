import sys

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Update import
content = content.replace('import { motion } from "motion/react";', 'import { motion, AnimatePresence } from "motion/react";')

# We will wrap the inside of `<div className="h-[380px] w-full">` with `<AnimatePresence mode="wait">`
# and change the `<div>` inside each `chartView === '...'` to `<motion.div>`

target_normalized = """            {chartView === 'normalized' && (
              <div className="w-full h-full flex flex-col">"""
replace_normalized = """            <AnimatePresence mode="wait">
            {chartView === 'normalized' && (
              <motion.div
                key="normalized"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full h-full flex flex-col"
              >"""
content = content.replace(target_normalized, replace_normalized)

# We need to change the closing tag of normalized.
# It ends right before `            {chartView === 'historical' && (`
# Let's find it.

content = content.replace("""              </div>
            )}
            {chartView === 'historical' && (""", """              </motion.div>
            )}
            {chartView === 'historical' && (""")

# historical
target_historical = """            {chartView === 'historical' && (
              <div className="w-full h-full flex flex-col">"""
replace_historical = """            {chartView === 'historical' && (
              <motion.div
                key="historical"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full h-full flex flex-col"
              >"""
content = content.replace(target_historical, replace_historical)

content = content.replace("""              </div>
            )}
            {chartView === 'radar' && (""", """              </motion.div>
            )}
            {chartView === 'radar' && (""")

# radar
target_radar = """            {chartView === 'radar' && (
              <div className="w-full h-full flex flex-col items-center justify-center relative">"""
replace_radar = """            {chartView === 'radar' && (
              <motion.div
                key="radar"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full flex flex-col items-center justify-center relative"
              >"""
content = content.replace(target_radar, replace_radar)

content = content.replace("""              </div>
            )}
            {chartView === 'delta' && (""", """              </motion.div>
            )}
            {chartView === 'delta' && (""")

# delta
target_delta = """            {chartView === 'delta' && (
              <div className="w-full h-full flex flex-col">"""
replace_delta = """            {chartView === 'delta' && (
              <motion.div
                key="delta"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full h-full flex flex-col"
              >"""
content = content.replace(target_delta, replace_delta)

# The end of delta ends right before `          </div>` that closes `<div className="h-[380px] w-full">`
# Let's replace the end of delta.
# It looks like:
#               </div>
#             )}
#           </div>
content = content.replace("""              </div>
            )}
          </div>
        </motion.div>""", """              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </motion.div>""")

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
