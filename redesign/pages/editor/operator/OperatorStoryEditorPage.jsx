import React from 'react'
import RedesignStoryEditorPage from '../storyEditor'

/**
 * OperatorStoryEditorPage
 * Directly reuses RedesignStoryEditorPage with isRecord={true}, providing complete
 * feature parity with the Story Editor (CodeMirror autocompletions, Asset Hub, 
 * modals, Live Preview, and Swiss-Brutalist design tokens) without event managers.
 */
export default function OperatorStoryEditorPage(props) {
    return <RedesignStoryEditorPage isRecord={true} {...props} />
}
