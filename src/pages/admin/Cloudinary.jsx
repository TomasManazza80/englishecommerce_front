import React, { useState } from 'react';
import { IKContext, IKUpload, IKImage } from 'imagekitio-react';

const API_URL = import.meta.env.VITE_API_URL;

const authenticator = async () => {
    try {
        const response = await fetch(`${API_URL}/api/auth/imagekit`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        const { signature, expire, token } = data;
        return { signature, expire, token };
    } catch (error) {
        throw new Error(`Authentication request failed: ${error.message}`);
    }
};

const Cloudinary = () => {
    // ESTE COMPONENTE AHORA ES UN TEST DE IMAGEKIT
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);

    const onError = err => {
        console.error("Error", err);
        setLoading(false);
    };

    const onSuccess = res => {
        console.log("Success", res);
        setImage(res.url);
        setLoading(false);
    };

    const onUploadStart = (evt) => {
        setLoading(true);
    };

    return (
        <IKContext
            publicKey={import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY}
            urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}
            authenticator={authenticator}
        >
            <div>
                <h1>Test ImageKit Upload</h1>

                <IKUpload
                    fileName="test_image"
                    useUniqueFileName={true}
                    folder="/test"
                    onError={onError}
                    onSuccess={onSuccess}
                    onUploadStart={onUploadStart}
                    disabled={loading}
                />

                {loading ? (
                    <h3>Loading...</h3>
                ) : (
                    image && (
                        <div>
                            <h3>Uploaded Image:</h3>
                            <IKImage
                                src={image}
                                transformation={[{ width: "300" }]}
                                alt="imagen subida"
                            />
                        </div>
                    )
                )}
            </div>
        </IKContext>
    );
}

export default Cloudinary;