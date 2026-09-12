import re

with open('components/AIAnalysisOverlay.tsx', 'r') as f:
    content = f.read()

# Add isAiOfflineMode prop
content = content.replace("interface AIAnalysisOverlayProps {", "interface AIAnalysisOverlayProps {\n  isAiOfflineMode?: boolean;")
content = content.replace("}: AIAnalysisOverlayProps) {", "  isAiOfflineMode = false\n}: AIAnalysisOverlayProps) {")

warning_html = """                        {isAiOfflineMode && (
                            <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">AI API Quota Exceeded (Offline Mode)</h4>
                                    <p className="text-xs opacity-90">The AI model is currently unavailable due to API rate limits. You are viewing the automated, pre-programmed quantitative analysis.</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Title & Perspective */}"""

content = content.replace("{/* Title & Perspective */}", warning_html)

with open('components/AIAnalysisOverlay.tsx', 'w') as f:
    f.write(content)
