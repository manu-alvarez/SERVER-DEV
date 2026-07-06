import logging
from fastapi import APIRouter, HTTPException, UploadFile, File

logger = logging.getLogger("traductor")

router = APIRouter()


@router.post("/documents/extract-text")
async def extract_text(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(400, "No se recibió ningún archivo")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "Archivo demasiado grande (máx 10MB)")

    try:
        texto = ""

        if file.content_type == "application/pdf" or (file.filename and file.filename.endswith(".pdf")):
            from pypdf import PdfReader
            import io
            reader = PdfReader(io.BytesIO(contents))
            texto = "\n".join(page.extract_text() or "" for page in reader.pages)
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or (
            file.filename and file.filename.endswith(".docx")
        ):
            from docx import Document
            import io
            doc = Document(io.BytesIO(contents))
            texto = "\n".join(p.text for p in doc.paragraphs)
        else:
            texto = contents.decode("utf-8")

        return {"texto": texto.strip()}
    except Exception as e:
        logger.error(f"Error extrayendo texto: {e}")
        raise HTTPException(500, f"Error extrayendo texto: {e}")
