"use client";

import { useEffect } from "react";

export default function PrintTrigger() {
  useEffect(() => {
    // Buscar todas las imágenes de la página
    const images = Array.from(document.querySelectorAll("img"));
    
    if (images.length === 0) {
      // Si no hay imágenes, lanzar impresión casi de inmediato
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
    
    let loadedCount = 0;
    const totalImages = images.length;
    
    const triggerPrint = () => {
      // Un pequeño retraso de 500ms para asegurar que el navegador renderice la imagen cargada
      setTimeout(() => {
        window.print();
      }, 500);
    };

    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        triggerPrint();
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        handleImageLoad();
      } else {
        img.addEventListener("load", handleImageLoad);
        img.addEventListener("error", handleImageLoad); // Contar errores también para evitar bloqueos
      }
    });

    // Fallback de seguridad: imprimir tras 5 segundos si alguna imagen se queda atascada
    const fallbackTimer = setTimeout(() => {
      if (loadedCount < totalImages) {
        console.warn("Print trigger fallback: imprimiendo antes de que carguen todas las imágenes");
        window.print();
      }
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      images.forEach((img) => {
        img.removeEventListener("load", handleImageLoad);
        img.removeEventListener("error", handleImageLoad);
      });
    };
  }, []);
  
  return null;
}
