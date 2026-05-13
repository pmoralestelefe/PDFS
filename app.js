import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. CONFIGURACIÓN DE FIREBASE (Reemplaza con tus datos de la consola de Firebase)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "TUS_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. LOGO EN BASE64 (Reemplaza esto con el string base64 de tu logo)
const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; 

// Capturar elementos del DOM
const btnGuardar = document.getElementById('btnGuardar');
const btnPresupuesto = document.getElementById('btnPresupuesto');
const btnRecibo = document.getElementById('btnRecibo');

// Función para obtener los datos del formulario
function getDatosFormulario() {
    return {
        cliente: document.getElementById('cliente').value,
        fecha: document.getElementById('fecha').value,
        detalles: document.getElementById('detalles').value,
        total: parseFloat(document.getElementById('total').value) || 0,
        sena: parseFloat(document.getElementById('sena').value) || 0,
        saldo: (parseFloat(document.getElementById('total').value) || 0) - (parseFloat(document.getElementById('sena').value) || 0)
    };
}

// 3. GUARDAR EN FIREBASE
btnGuardar.addEventListener('click', async () => {
    const data = getDatosFormulario();
    if (!data.cliente || data.total === 0) {
        alert("Por favor, completa al menos el cliente y el total.");
        return;
    }
    
    try {
        const docRef = await addDoc(collection(db, "proyectos_aprobados"), {
            ...data,
            fechaRegistro: new Date()
        });
        alert("Proyecto guardado exitosamente en la base de datos.");
    } catch (e) {
        console.error("Error al guardar: ", e);
        alert("Hubo un error al guardar en Firebase.");
    }
});

// 4. GENERAR PDF: PRESUPUESTO
btnPresupuesto.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = getDatosFormulario();

    // Encabezado
    doc.addImage(logoBase64, 'PNG', 15, 15, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("PORTONES AUTOMÁTICOS CÓRDOBA", 60, 30);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(data.fecha, 60, 40);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Cliente: ${data.cliente}`, 15, 70);
    
    // Cuerpo del presupuesto
    doc.setFont("helvetica", "normal");
    doc.text("De acuerdo a lo conversado, se detallan a continuación las soluciones propuestas para optimizar", 15, 80);
    doc.text("las entradas del hogar, priorizando seguridad, comodidad y durabilidad en el tiempo.", 15, 86);
    
    // Detalles (Separando por saltos de línea para que se ajuste)
    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DEL PROYECTO", 15, 100);
    doc.setFont("helvetica", "normal");
    const lineasDetalle = doc.splitTextToSize(data.detalles, 180);
    doc.text(lineasDetalle, 15, 110);
    
    let Y_final_detalles = 110 + (lineasDetalle.length * 7) + 10;
    
    // Totales y Condiciones
    doc.setFont("helvetica", "bold");
    doc.text(`Total del proyecto: $${data.total.toLocaleString("es-AR")} ARS`, 15, Y_final_detalles);
    
    doc.text("Condiciones:", 15, Y_final_detalles + 15);
    doc.setFont("helvetica", "normal");
    doc.text(`• Seña para confirmación: $${data.sena.toLocaleString("es-AR")} ARS`, 15, Y_final_detalles + 22);
    doc.text("• Plazo de entrega: 30 días desde la confirmación", 15, Y_final_detalles + 29);
    doc.text(`• Saldo final: $${data.saldo.toLocaleString("es-AR")} ARS al finalizar el trabajo`, 15, Y_final_detalles + 36);
    doc.text("• El presente documento reviste carácter de contrato entre las partes", 15, Y_final_detalles + 43);
    
    // Firmas
    doc.text("_________________________", 30, 260);
    doc.text("Portones Automáticos Córdoba", 25, 267);
    doc.text("_________________________", 130, 260);
    doc.text("Cliente", 150, 267);

    doc.save(`Presupuesto_${data.cliente}.pdf`);
});

// 5. GENERAR PDF: RECIBO DE PAGO
btnRecibo.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = getDatosFormulario();

    // Encabezado
    doc.addImage(logoBase64, 'PNG', 15, 15, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("PORTONES AUTOMÁTICOS CÓRDOBA", 60, 30);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(data.fecha, 60, 40);
    
    // Título Recibo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RECIBO DE PAGO", 85, 65);
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${data.cliente}`, 15, 80);
    
    doc.setFont("helvetica", "normal");
    doc.text("Por medio del presente se deja constancia de la recepción de dinero correspondiente al proyecto", 15, 90);
    doc.text("de portones automáticos detallado previamente entre las partes.", 15, 96);
    
    // Tabla usando jsPDF-AutoTable
    doc.autoTable({
        startY: 110,
        head: [['Concepto', 'Monto']],
        body: [
            ['Seña entregada', `$${data.sena.toLocaleString("es-AR")} ARS`],
            ['Saldo pendiente', `$${data.saldo.toLocaleString("es-AR")} ARS`],
            ['Total del proyecto', `$${data.total.toLocaleString("es-AR")} ARS`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80] },
        styles: { fontSize: 12, cellPadding: 6 }
    });
    
    let Y_final_tabla = doc.lastAutoTable.finalY + 15;
    
    doc.text("El saldo restante deberá ser abonado al momento de la finalización del trabajo, contra entrega y", 15, Y_final_tabla);
    doc.text("conformidad del cliente.", 15, Y_final_tabla + 6);
    doc.text("El presente documento reviste carácter de comprobante y acuerdo entre las partes.", 15, Y_final_tabla + 18);
    
    // Firmas
    doc.text("_________________________", 30, 260);
    doc.text("Firma representante", 35, 267);
    doc.text("_________________________", 130, 260);
    doc.text("Firma cliente", 145, 267);

    doc.save(`ReciboPago_${data.cliente}.pdf`);
});