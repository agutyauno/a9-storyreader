import React, { useEffect, useRef, useState } from 'react';
import { StoryRenderer as StoryRendererUtil } from '../../utils/storyRenderer';
// We import the CSS module so the classnames match the parsed HTML string
import styles from '../../styles/StoryPage.module.css';

/**
 * A wrapper component that safely renders the converted HTML script.
 * Suitable for both the Live Preview and the main StoryPage. 
 */
export default function StoryRenderer({ previewData, isPreviewMode }) {
    const contentRef = useRef(null);
    const [htmlContent, setHtmlContent] = useState('');

    // Re-render HTML when story_content changes
    useEffect(() => {
        if (!previewData?.story_content) {
            setHtmlContent('');
            return;
        }
        
        try {
            const html = StoryRendererUtil.render(previewData.story_content, styles);
            setHtmlContent(html);
        } catch (err) {
            console.error("Failed to render story content", err);
            setHtmlContent('<div class="text-red-500">Error rendering preview</div>');
        }
    }, [previewData]);

    // DOM manipulating side-effects (Choice clicks, Parallax, BGM)
    useEffect(() => {
        if (!htmlContent || !contentRef.current) return;
        const contentDiv = contentRef.current;

        // Decision Choices Logic
        const decisionGroups = contentDiv.querySelectorAll(`.${styles['decision-group'] || 'decision-group'}`);
        decisionGroups.forEach(group => {
            const groupId = group.getAttribute('data-choice-group');
            const decisions = group.querySelectorAll(`.${styles['decision'] || 'decision'}`);
            const responses = contentDiv.querySelectorAll(`.${styles['choice-response'] || 'choice-response'}[data-choice-group="${groupId}"]`);
            
            // Clean up old listeners to prevent duplicates during fast reloads
            const clonedDecisions = Array.from(decisions).map(d => {
                const clone = d.cloneNode(true);
                d.parentNode.replaceChild(clone, d);
                return clone;
            });

            clonedDecisions.forEach(decision => {
                decision.addEventListener('click', () => {
                    const choiceValue = decision.getAttribute('data-choice-value');
                    clonedDecisions.forEach(d => d.classList.remove(styles['selected'] || 'selected'));
                    decision.classList.add(styles['selected'] || 'selected');
                    responses.forEach(r => {
                        if (r.getAttribute('data-choice-response') === choiceValue) {
                            r.classList.add(styles['active'] || 'active');
                        } else {
                            r.classList.remove(styles['active'] || 'active');
                        }
                    });
                });
            });
            if (clonedDecisions[0]) clonedDecisions[0].click();
        });

        // BGM Scroll Triggers (Disable in preview mode to avoid annoying the user)
        if (!isPreviewMode && window.bgmManager) {
            window.bgmManager.setupScrollTriggers({ selector: '[data-bgm-id]', threshold: 0, rootMargin: '0px 0px -20% 0px' });
        }
        
        // Auto-scroll to bottom behavior for live preview
        if (isPreviewMode) {
            contentDiv.scrollTop = contentDiv.scrollHeight;
        }

    }, [htmlContent, isPreviewMode]);

    return (
        <div 
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: isPreviewMode ? '#000' : 'transparent',
                overflowY: isPreviewMode ? 'auto' : 'visible',
                paddingBottom: isPreviewMode ? '48px' : 0,
            }}
        >
            <div 
                ref={contentRef} 
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
                className={`${styles['container'] || ''} ${isPreviewMode ? styles['isPreviewMode'] : ''}`}
                style={isPreviewMode ? {
                    transformOrigin: 'top center',
                    /* Scale down slightly if the preview area is narrow */
                    maxWidth: '100%',
                } : undefined}
            />
        </div>
    );
}
