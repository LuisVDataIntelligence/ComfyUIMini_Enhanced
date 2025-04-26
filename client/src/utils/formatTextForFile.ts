function formatTextForFile(text: string) {
    return text
        .trim()
        .replace(/[\s]+/g, '_') // Replace spaces and whitespace with underscores
        .replace(/[\/\\?%*:|"<>]/g, '') // Remove forbidden characters
        .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Remove control characters
        .replace(/\.+$/, ''); // Remove trailing dots
}

export default formatTextForFile;