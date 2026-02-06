const setupContactForm = () => {
  const form = document.getElementById("contact-form");
  const feedback = document.getElementById("form-feedback");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const nombre = (formData.get("nombre") || "").toString().trim();
    const negocio = (formData.get("negocio") || "").toString().trim();
    const objetivo = (formData.get("objetivo") || "").toString().trim();
    const prioridad = (formData.get("prioridad") || "").toString().trim();
    const detalles = (formData.get("detalles") || "").toString().trim();

    if (!nombre || !objetivo) {
      if (feedback) {
        feedback.textContent = "Completa al menos tu nombre y el objetivo principal.";
      }
      return;
    }

    const lines = [
      "Hola Jefferson, quiero una consulta para mi negocio.",
      `Nombre: ${nombre}`,
      negocio ? `Negocio: ${negocio}` : "",
      `Objetivo principal: ${objetivo}`,
      prioridad ? `Prioridad: ${prioridad}` : "",
      detalles ? `Detalles adicionales: ${detalles}` : "",
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join("\n"));
    const url = `https://wa.me/593959186832?text=${text}`;
    window.open(url, "_blank", "noopener");

    if (feedback) {
      feedback.textContent = "Mensaje preparado. Abriendo WhatsApp...";
    }
  });
};

document.addEventListener("DOMContentLoaded", setupContactForm);
