import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StoryScriptParser } from '../../../../src/utils/storyParser';
import { StoryRenderer } from '../../../../src/utils/storyRenderer';
import '../../story/story.css';

export default function LivePreview({ scriptText, name = 'Live Preview', characters = [], assets = [] }) {
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const contentRef = useRef(null);

    const charCacheMap = useMemo(() => {
        return Object.fromEntries(characters.map(c => [c.character_id || c.id, c]));
    }, [characters]);

    const assetCacheMap = useMemo(() => {
        return Object.fromEntries(assets.map(a => [a.asset_id || a.id, a]));
    }, [assets]);

    useEffect(() => {
        const timerId = setTimeout(async () => {
            if (!scriptText) {
                setPreviewData(null);
                setHtmlContent('');
                return;
            }
            setPreviewLoading(true);
            try {
                const parsed = await StoryScriptParser.parseWithDB(scriptText, charCacheMap, assetCacheMap);
                setPreviewData({ name, story_content: parsed });
                setHtmlContent(StoryRenderer.render(parsed));
            } catch (err) {
                try {
                    const parsed = StoryScriptParser.parse(scriptText);
                    setPreviewData({ name, story_content: parsed });
                    setHtmlContent(StoryRenderer.render(parsed));
                } catch (syncErr) {
                    console.warn('Live Preview parse failed:', syncErr);
                }
            } finally {
                setPreviewLoading(false);
            }
        }, 600);

        return () => clearTimeout(timerId);
    }, [scriptText, name, charCacheMap, assetCacheMap]);

    // Bind Choice clicks inside preview html
    useEffect(() => {
        if (!htmlContent || !contentRef.current) return;
        const contentDiv = contentRef.current;

        // Decision Choices Logic
        const decisionGroups = contentDiv.querySelectorAll('.decision-group');
        decisionGroups.forEach(group => {
            const groupId = group.getAttribute('data-choice-group');
            const decisions = group.querySelectorAll('.decision');
            const responses = contentDiv.querySelectorAll(`.choice-response[data-choice-group="${groupId}"]`);

            decisions.forEach(decision => {
                const clickHandler = () => {
                    const choiceValue = decision.getAttribute('data-choice-value');
                    decisions.forEach(d => d.classList.remove('selected'));
                    decision.classList.add('selected');
                    responses.forEach(r => {
                        if (r.getAttribute('data-choice-response') === choiceValue) {
                            r.classList.add('active');
                        } else {
                            r.classList.remove('active');
                        }
                    });
                };
                decision.removeEventListener('click', decision._clickFn);
                decision._clickFn = clickHandler;
                decision.addEventListener('click', clickHandler);
            });
            if (decisions[0]) decisions[0].click();
        });

        // Auto-scroll to bottom of the preview scroller
        const parentScroller = contentDiv.closest('.preview-body-scroller');
        if (parentScroller) {
            parentScroller.scrollTop = parentScroller.scrollHeight;
        }

    }, [htmlContent]);

    return (
        <div className="live-preview-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="preview-header" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-charcoal)',
                color: 'var(--color-cream)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                borderBottom: '2px solid var(--color-charcoal)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: previewLoading ? 'var(--color-ochre)' : 'var(--color-sage)',
                        display: 'inline-block'
                    }} />
                    <span>{previewLoading ? 'RESOLVING_ASSETS...' : 'LIVE_PREVIEW'}</span>
                </div>
            </div>

            <div className="preview-body-scroller" style={{ flexGrow: 1, overflowY: 'auto', position: 'relative' }}>
                <div className="story-reader-container page-fade-in" style={{ padding: '2rem 1.5rem' }}>
                    {htmlContent ? (
                        <div ref={contentRef} dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '200px',
                            color: 'rgba(255,255,255,0.4)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.85rem'
                        }}>
                            AWAITING_INPUT_SEQUENCE...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
