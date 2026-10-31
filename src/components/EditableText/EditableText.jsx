import React, { useContext, useState, useEffect, useRef } from "react";
import CmsContext from "../../store/CmsContext";

const EditableText = ({
  textKey,
  defaultText,
  as: Component = "span",
  className = "",
  section = "GENERAL"
}) => {
  const { texts, editMode, saveTextToBackend } = useContext(CmsContext);
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef(null);

  const currentValue = texts[textKey] !== undefined ? texts[textKey] : defaultText;
  const valueRef = useRef(currentValue);

  useEffect(() => {
    if (!isEditing) {
      valueRef.current = currentValue;
      if (contentRef.current && contentRef.current.innerHTML !== currentValue) {
        contentRef.current.innerHTML = currentValue;
      }
    }
  }, [currentValue, isEditing]);

  const handleClick = (e) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    if (contentRef.current && document.activeElement !== contentRef.current) {
      contentRef.current.focus();
    }
  };

  const handleFocus = () => {
    if (!editMode) return;
    setIsEditing(true);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "CMS_EDITING_ACTIVE",
          payload: { key: textKey, section }
        },
        "*"
      );
    }
  };

  const handleInput = (e) => {
    valueRef.current = e.currentTarget.innerHTML;
  };

  const handleKeyDown = (e) => {
    if (!editMode) return;
    e.stopPropagation();
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    if (!editMode) return;
    setIsEditing(false);
    const newValue = (valueRef.current ?? "").trim();
    if (newValue === currentValue) return;

    saveTextToBackend(textKey, newValue, section);
  };

  if (!editMode) {
    return (
      <Component
        className={className}
        data-cms-editable="true"
        data-cms-key={textKey}
        dangerouslySetInnerHTML={{ __html: currentValue }}
      />
    );
  }

  return (
    <Component
      ref={contentRef}
      contentEditable={true}
      suppressContentEditableWarning={true}
      data-cms-editable="true"
      data-cms-key={textKey}
      data-cms-section={section}
      onClick={handleClick}
      onFocus={handleFocus}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      title="Haz clic y escribe para modificar este texto"
      className={`${className} cursor-text transition-all duration-150 ${
        isEditing
          ? "outline outline-2 outline-[#d2bbff] bg-[#7c3aed]/20 shadow-[0_0_20px_rgba(124,58,237,0.35)] rounded-lg px-1.5 -mx-1.5 z-50 relative"
          : "outline outline-1 outline-dashed outline-[#a855f7]/65 hover:outline-2 hover:outline-[#d2bbff] hover:bg-[#7c3aed]/15 rounded-lg px-1 -mx-1"
      }`}
    />
  );
};

export default EditableText;
