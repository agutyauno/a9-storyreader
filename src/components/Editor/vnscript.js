import { tags as t } from "@lezer/highlight"
import { StreamLanguage } from "@codemirror/language"

/**
 * Custom CodeMirror 6 stream parser for our VNScript format.
 * Adapted from the CM5 definition in legacy/editor/story-editor.js
 */
const vnscriptParser = {
    startState: function () {
        return { context: 'default' };
    },
    token: function (stream, state) {
        if (stream.sol()) {
            state.context = 'default';

            // Comment
            if (stream.match(/^#.*/)) return 'comment';

            // Directive (@keyword)
            if (stream.match(/^@\w+/)) {
                state.context = 'directive';
                return 'keyword';
            }

            // Choice line (- text)
            if (stream.match(/^-\s+/)) {
                stream.skipToEnd();
                return 'string'; // Use string class for choices
            }

            // Dialogue name — text before [ or : (not starting with special chars)
            if (!stream.match(/^[@#\-]/, false) && stream.match(/^[^\[\]:]+(?=\s*[\[:])/)) {
                state.context = 'dialogue';
                return 'variableName';
            }
        }

        // Quoted strings
        if (stream.peek() === '"') {
            stream.next();
            stream.eatWhile(/[^"]/);
            if (stream.peek() === '"') stream.next();
            return 'string';
        }

        // Square brackets [left, right]
        if (stream.peek() === '[') {
            stream.next();
            stream.eatWhile(/[^\]]/);
            if (stream.peek() === ']') stream.next();
            return 'bracket';
        }

        // Param name before = in directive context
        if (state.context === 'directive' && stream.match(/\w+(?==)/)) {
            return 'propertyName';
        }

        // =
        if (stream.match(/^=/)) return 'operator';

        // Colon (dialogue separator) or Braces
        if (stream.match(/^:/)) return 'punctuation';
        if (stream.match(/^[{}]$/)) return 'bracket';

        // Numbers
        if (stream.match(/^\d+/)) return 'number';

        // Whitespace
        if (stream.eatSpace()) return null;

        stream.next();
        return null;
    }
};

export const vnscriptLanguage = StreamLanguage.define(vnscriptParser);
