export function handleVisionSync(dropzone, previewImg, evaluator) {
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('bg-slate-700/50', 'border-emerald-500');
    });
    
    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('bg-slate-700/50', 'border-emerald-500');
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('bg-slate-700/50', 'border-emerald-500');
        
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            previewImg.src = base64;
            previewImg.classList.remove('hidden');
            
            evaluator.processVisionUpdate({
                filename: file.name,
                timestamp: Date.now(),
                data: base64.substring(0, 50) + '...[TRUNCATED]' // Evitar colapso en logs
            });
        };
        reader.readAsDataURL(file);
    });
}
