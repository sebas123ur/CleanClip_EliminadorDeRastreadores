// Lista de parámetros de rastreo y publicidad que deben ser eliminados de las URLs
const parametrosABorrar = [
    // --- Nivel 1: Publicidad y Analítica Global (Google, Meta, Mail) ---
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "utm_source_platform",
    "fbclid", "gclid", "dclid", "msclkid", "twclid", "igshid", "_ga", "_gl", "mc_cid", "mc_eid", "yclid",

    // --- Nivel 2: E-Commerce y Afiliados (Amazon, MercadoLibre, AliExpress, eBay) ---
    "pd_rd_w", "content-id", "pf_rd_p", "pf_rd_r", "pd_rd_wg", "pd_rd_r", "_encoding", "ref_",
    "psc", "sprefix", "sr", "linkCode", "tag", "camp", "creative", "qid", "as_content_kind",
    "mra", "origin", "basket_item_id", "aff_fcid", "aff_fsk", "aff_platform", "sk", 
    "matt_tool", "matt_word", "matt_seller_id", // MercadoLibre Ad Tracking

    // --- Nivel 3: Redes Sociales y Plataformas (TikTok, X/Twitter, Reddit) ---
    "si", "feature", "ab_channel", "pp", "at", "context", "t",
    "s", "ref_src", "ref_url", "or", "from", "share_id", "share_app_name", "share_iid",
    "_r", "is_copy_url", "is_from_webapp", // TikTok
    "st", "rdt" // Reddit & Twitter
];

// Función principal para procesar, limpiar y validar la URL
const limpiarUrl = (urlSuplementaria) => {
    try {
        const url = new URL(urlSuplementaria);
        let modificado = false;

        // Recorre la lista y elimina los parámetros de rastreo si existen
        parametrosABorrar.forEach(param => {
            if (url.searchParams.has(param)) {
                url.searchParams.delete(param);
                modificado = true;
            }
        });

        // Retorna un objeto con la URL limpia y un indicador de si sufrió cambios
        return {
            urlFinal: url.toString(),
            teniaRastreadores: modificado
        };

    } catch (error) {
        // Fallback: si la URL no es válida, devuelve el texto original sin modificar
        return {
            urlFinal: urlSuplementaria,
            teniaRastreadores: false
        }
    }
};

// Se ejecuta al cargar completamente el DOM de la extensión
document.addEventListener("DOMContentLoaded", () => {

    // Traducción automática de los elementos con data-i18n al abrir la extensión
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const messageKey = element.getAttribute("data-i18n");
        const translatedText = chrome.i18n.getMessage(messageKey);
        if (translatedText) {
            element.textContent = translatedText;
        }
    });

    // Referencias a los elementos del DOM de la interfaz
    const elements = {
        cafeTexto: document.getElementById("urlInput"), // Caja de texto para la URL
        cleanBtn: document.getElementById("cleanBtn"),   // Botón principal de acción
        statusDiv: document.getElementById("status")    // Área de mensajes y estados
    }
    
    // Detector de cambios manuales: si el usuario escribe o pega, cambia el estado del botón y limpia mensajes
    elements.cafeTexto.addEventListener("input", () => {
        elements.cleanBtn.textContent = chrome.i18n.getMessage("cleanAndCopyButton");
        elements.statusDiv.textContent = "";
    });

    // Carga automática: obtiene la URL de la pestaña activa al abrir la extensión
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
            const resultado = limpiarUrl(tabs[0].url);
            elements.cafeTexto.value = resultado.urlFinal;
            
            // Muestra mensajes de estado según si la URL automática tenía rastreadores o no
            if (resultado.teniaRastreadores) {
                elements.statusDiv.textContent = chrome.i18n.getMessage("hadTrackers");
            } else {
                elements.statusDiv.style.color = "var(--color-info)"
                elements.statusDiv.textContent = chrome.i18n.getMessage("noTrackersFound");
            }
        }
        // Estado inicial del botón al cargar el enlace de la pestaña de forma automática
        elements.cleanBtn.textContent = chrome.i18n.getMessage("copyButton");
    });

    // Evento del botón principal (maneja tanto copiado rápido como limpieza de texto ingresado a mano)
    elements.cleanBtn.addEventListener("click", () => {
        const textoIngresado = elements.cafeTexto.value.trim();
        try {
            // Validación: verifica que la caja de texto no esté vacía
            if (!textoIngresado) {
                elements.statusDiv.style.color = "var(--color-info)";
                elements.statusDiv.textContent = chrome.i18n.getMessage("textBoxVerification");
                return;
            }

            // Valida que el texto sea una URL real
            new URL(textoIngresado);
            const resultado = limpiarUrl(textoIngresado);
            elements.cafeTexto.value = resultado.urlFinal;

            // Escritura asíncrona en el portapapeles del navegador
            navigator.clipboard.writeText(resultado.urlFinal).then(() => {

                // Comportamiento del mensaje de estado según el origen de la acción del botón
                if (elements.cleanBtn.textContent == chrome.i18n.getMessage("copyButton")) {
                    elements.statusDiv.textContent = chrome.i18n.getMessage("linkCopied");
                } else {
                    if (resultado.teniaRastreadores) {              
                        elements.statusDiv.style.color = "var(--color-exito)";            
                        elements.statusDiv.textContent = chrome.i18n.getMessage("urlCleaned");
                   
                    } else {
                        elements.statusDiv.style.color = "var(--color-info)";
                        elements.statusDiv.textContent = chrome.i18n.getMessage("noTrackers");
                    }
                }
                // Prepara el botón para el próximo uso manual
                elements.cleanBtn.textContent = chrome.i18n.getMessage("cleanAndCopyButton");
            });
        } catch {
            // Manejo de errores si el usuario ingresa un texto que no es una URL válida
            elements.statusDiv.style.color = "var(--color-error)";
            elements.statusDiv.textContent = chrome.i18n.getMessage("pasteValidLink");
        }
    });

});