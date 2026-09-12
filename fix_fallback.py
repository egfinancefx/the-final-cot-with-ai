import re

with open('components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Make the UI show a warning if fallback is used
content = content.replace("setAiAnalysis(resData.text);", "setAiAnalysis(resData.text);\n        setIsAiOfflineMode(false);")
content = content.replace("const fallbackText = generateLocalFallbackAnalysis(", "setIsAiOfflineMode(true);\n        const fallbackText = generateLocalFallbackAnalysis(")

# Add state for offline mode
content = content.replace("const [isAnalyzing, setIsAnalyzing] = useState(false);", "const [isAnalyzing, setIsAnalyzing] = useState(false);\n  const [isAiOfflineMode, setIsAiOfflineMode] = useState(false);")

# Show warning in UI
warning_html = """                        {/* TradingView Widget Backing */}</>"""
# Let's just insert it right after <div className="p-6 relative"> in AIAnalysisOverlay.tsx instead!

with open('components/Dashboard.tsx', 'w') as f:
    f.write(content)
