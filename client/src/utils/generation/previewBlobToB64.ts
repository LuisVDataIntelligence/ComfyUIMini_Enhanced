function previewBlobToB64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            const buffer = reader.result as ArrayBuffer;
            const view = new DataView(buffer);

            const imageType = view.getUint32(0, false);
            let imageMime: string;

            switch (imageType) {
                case 1:
                    imageMime = 'image/jpeg';
                    break;
                case 2:
                    imageMime = 'image/png';
                    break;
                default:
                    imageMime = 'image/jpeg';
                    break;
            }

            const imageBlob = buffer.slice(8);
            const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBlob)));

            resolve(`data:${imageMime};base64,${base64Image}`);
        }

        reader.onerror = (error) => {
            reject(error);
        }

        reader.readAsArrayBuffer(blob);
    });
}

export default previewBlobToB64;