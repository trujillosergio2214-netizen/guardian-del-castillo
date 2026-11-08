const MAX_TURNOS = 15;     // cuántos mensajes puedes enviar
const META = 100;          // confianza para ganar

let confianza = 30;        // arrancas con 30
let turnos = MAX_TURNOS;
let terminado = false;
const historial = [];      // { rol: "jugador" | "dragon", texto }

// ---------- Elementos de la página ----------
const formulario = document.getElementById("formulario");
const entrada = document.getElementById("entrada");
const boton = formulario.querySelector("button");
const chat = document.getElementById("chat");
const dragon = document.getElementById("dragon");
const barra = document.getElementById("confianza");
const estado = document.getElementById("estado");
const marcadorTurnos = document.getElementById("turnos");

// ---------- Dibujar la pantalla ----------
function agregarMensaje(texto, clase) {
    const burbuja = document.createElement("div");
    burbuja.className = "msg " + clase;
    burbuja.textContent = texto;                  // textContent: nunca interpreta HTML
    chat.appendChild(burbuja);
    chat.scrollTop = chat.scrollHeight;
    historial.push({ rol: clase === "jugador" ? "jugador" : "dragon", texto });
    const voz = new SpeechSynthesisUtterance(texto);
    voz.lang = "es-ES";
    speechSynthesis.speak(voz);
}

function actualizarPantalla() {
    const valor = Math.max(0, Math.min(META, confianza));
    barra.style.width = valor + "%";
    barra.style.background = valor >= 60 ? "#4cd964" : valor >= 30 ? "#ffb400" : "#ff453a";
    estado.textContent = `Confianza: ${Math.round(valor)} / ${META}`;
    marcadorTurnos.textContent = `Turnos restantes: ${turnos}`;

    dragon.classList.remove("feliz", "enojado");
    if (valor >= 60) dragon.classList.add("feliz");
    else if (valor < 25) dragon.classList.add("enojado");
}

function terminar(gano) {
    terminado = true;
    entrada.disabled = true;
    boton.disabled = true;
    agregarMensaje(
        gano
            ? "🗝️ ¡Has ganado mi confianza! Toma la llave, viajero."
            : "🔥 Se acabó. El dragón te echa del castillo. Recarga la página para intentarlo otra vez.",
        "dragon-msg"
    );
}

// ---------- Cada mensaje que envías ----------
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (terminado) return;

    const texto = entrada.value.trim();
    if (!texto) return;

    const previo = historial.slice();      // lo dicho ANTES de este mensaje (el servidor añade el actual)
    agregarMensaje(texto, "jugador");
    entrada.value = "";
    entrada.disabled = true;
    boton.disabled = true;

    const ia = await consultarDragonIA(texto, previo);    // ← IA en la nube (puede dar null)
    const intencion = detectarIntencion(texto);
    let sentimiento, cambio, respuesta;

    if (ia && typeof ia.respuesta === "string") {
        if (typeof ia.sentimiento === "number") {          // ✅ la IA evaluó y respondió
            sentimiento = ia.sentimiento;
            cambio = sentimiento * 2.5;
        } else {                                           // la IA solo mandó texto: puntúa el diccionario
            sentimiento = analizarSentimiento(texto);
            cambio = sentimiento * 6;
        }
        respuesta = ia.respuesta;
    } else {                                             // ❌ la IA falló: plan B, tu diccionario
        sentimiento = analizarSentimiento(texto);
        cambio = sentimiento * 6;
        respuesta = null;
    }

    confianza += Math.max(-25, Math.min(25, cambio));    // cambio máximo de ±25
    turnos--;

    const humor = sentimiento >= 0 && confianza >= 25 ? "bien" : "mal";
    if (!respuesta) respuesta = (RESPUESTAS[intencion] || RESPUESTAS.desconocida)[humor];
    agregarMensaje(respuesta, "dragon-msg");

    actualizarPantalla();
    if (confianza >= META) terminar(true);                    // ganas
    else if (confianza <= 0 || turnos === 0) terminar(false); // pierdes
    else {
        entrada.disabled = false;
        boton.disabled = false;
        entrada.focus();
    }
});

actualizarPantalla();