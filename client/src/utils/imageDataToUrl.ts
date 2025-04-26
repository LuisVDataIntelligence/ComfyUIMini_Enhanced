function imageDataToUrl(comfyuiUrl: string, imageData: ComfyImageData): string {
    return `${comfyuiUrl}/api/view?filename=${imageData.filename}&subfolder=${imageData.subfolder}&type=${imageData.type}`;
}

export default imageDataToUrl;