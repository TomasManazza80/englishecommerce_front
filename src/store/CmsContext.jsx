import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const CmsContext = createContext();

export const CmsProvider = ({ children }) => {
    const [texts, setTexts] = useState({});
    const [editMode, setEditMode] = useState(false);
    
    // Check if we are inside the admin iframe with editMode=true
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('editMode') === 'true') {
            setEditMode(true);
        }

        const handleMessage = (event) => {
            // Validaciones de seguridad en un entorno real...
            if (event.data?.type === 'TOGGLE_EDIT_MODE') {
                setEditMode(event.data.payload);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const fetchTexts = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/cms/texts`);
            setTexts(res.data);
        } catch (error) {
            console.error('Error fetching CMS texts:', error);
        }
    };

    useEffect(() => {
        fetchTexts();
    }, []);

    const updateTextLocal = (key, value) => {
        setTexts(prev => ({ ...prev, [key]: value }));
    };

    return (
        <CmsContext.Provider value={{ texts, editMode, updateTextLocal }}>
            {children}
        </CmsContext.Provider>
    );
};

export default CmsContext;
