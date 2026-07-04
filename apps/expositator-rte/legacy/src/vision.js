/**
 * @function startCapture
 * @description Solicita acceso a MediaDevices para la captura del viewport.
 * [WARNING] Requiere permisos de sistema (Screen Recording) y Contexto Seguro (HTTPS/localhost).
 */
export const startCapture = async () => {
    const displayMediaOptions = {
        video: {
            displaySurface: "monitor",
            logicalSurface: true,
            cursor: "always"
        },
        audio: false,
        systemAudio: "exclude"
    };
    return await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
};

export const stopCapture = (stream) => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
};
