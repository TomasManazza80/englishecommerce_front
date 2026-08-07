import React, { useContext, useState, useEffect, useRef } from 'react';
import CmsContext from '../../store/CmsContext';

const EditableText = ({ textKey, defaultText, as: Component = 'span', className = '', section = 'GENERAL' }) => {
    const { texts, editMode, updateTextLocal } = useContext(CmsContext);
    const [isEditing, setIsEditing] = useState(false);
    const contentRef = useRef(null);
    
    const currentValue = texts[textKey] !== undefined ? texts[textKey] : defaultText;
    const valueRef = useRef(currentValue);

    // Keep valueRef in sync when context text updates (and user is not currently editing)
    useEffect(() => {
        if (!isEditing) {
            valueRef.current = currentValue;
        }
    }, [currentValue, isEditing]);

    const handleInput = (e) => {
        // Store typed value in ref without triggering state re-render on every keystroke
        valueRef.current = e.currentTarget.innerText || e.currentTarget.textContent;
    };

    const handleBlur = () => {
        setIsEditing(false);
        const newValue = valueRef.current;
        
        // Inform context of the local change
        updateTextLocal(textKey, newValue);
        
        // Notify parent iframe (Admin Editor) about the change
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'UPDATE_TEXT',
                payload: { key: textKey, value: newValue, section }
            }, '*');
        }
    };

    if (!editMode) {
        return (
            <Component className={className} dangerouslySetInnerHTML={{ __html: currentValue }} />
        );
    }

    // In Edit Mode
    return (
        <Component
            ref={contentRef}
            contentEditable={true}
            suppressContentEditableWarning={true}
            onInput={handleInput}
            onBlur={handleBlur}
            onFocus={() => setIsEditing(true)}
            className={`${className} cursor-text transition-all duration-200 ${
                isEditing 
                ? 'outline outline-2 outline-[#b273c2] bg-white/50 rounded-md z-50 relative' 
                : 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-[#b273c2]/70 hover:bg-white/30 rounded-md'
            }`}
            style={{ 
                minWidth: '50px', 
                display: 'inline-block'
            }}
            dangerouslySetInnerHTML={isEditing ? undefined : { __html: currentValue }}
        />
    );
};

export default EditableText;
