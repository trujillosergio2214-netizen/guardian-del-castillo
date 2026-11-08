const LEXICO = {
  // positivas
  gracias: 2, hermoso: 3, genial: 3, poderoso: 3, amigo: 2, admiro: 3, valiente: 2,
  tremendo: 3, máquina: 4, feliz: 3, amor: 4, inteligente: 4, divertido: 3, bueno: 2, maravilloso: 4,
  // negativas
  feo: -3, tonto: -3, idiota: -4, odio: -4, cobarde: -3, basura: -4, malo: -3, horrible: -4,
  estúpido: -4, inútil: -3, patético: -3, débil: -2, triste: -3, enojado: -3, terrible: -4
};

function normalizar(texto) {
  return texto
    .toLowerCase()                                      // todo a minúscula
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // quita tildes
    .replace(/[^a-zñ\s]/g, " ")                         // quita signos
    .replace(/\s+/g, " ")                               // un solo espacio entre palabras
    .trim();
}

// Versión normalizada del léxico (así "Máquina" y "estúpido" sí coinciden)
const LEXICO_N = {};
for (const [palabra, valor] of Object.entries(LEXICO)) LEXICO_N[normalizar(palabra)] = valor;

// Solo palabras sueltas: el texto se compara palabra por palabra
const NEGADORES = ["no", "nunca", "jamas", "tampoco", "nada"].map(normalizar);

function analizarSentimiento(texto) {
  const palabras = normalizar(texto).split(" ");
  let puntaje = 0;

  palabras.forEach((palabra, i) => {
    let valor = LEXICO_N[palabra] || 0;

    // "no eres feo": la negación invierte el valor
    if (valor !== 0 && (NEGADORES.includes(palabras[i - 1]) || NEGADORES.includes(palabras[i - 2]))) {
      valor = -valor;
    }
    puntaje += valor;
  });

  if (texto.includes("!") && puntaje < 0) puntaje -= 1;   // gritar empeora el insulto
  return puntaje;
}

const INTENCIONES = [
  { nombre: "saludo",         claves: ["hola", "buenas", "saludos", "hey", "buenos días", "buenas tardes", "buenas noches"] },
  { nombre: "llave",          claves: ["llave", "puerta", "abrir", "tesoro", "llavero"] },
  { nombre: "nombre",         claves: ["nombre", "llamas", "quien", "cómo te llamas", "cuál es tu nombre"] },
  { nombre: "chiste",         claves: ["chiste", "gracioso", "risa", "broma", "graciosa", "chistoso", "divertido"] },
  { nombre: "comida",         claves: ["comida", "hambre", "comer", "oveja", "hambriento"] },
  { nombre: "despedida",      claves: ["adios", "chao", "bye", "hasta luego", "hasta mañana"] },
  { nombre: "agradecimiento", claves: ["gracias", "muchas gracias", "te lo agradezco", "agradecido", "agradecida"] },
  { nombre: "insulto",        claves: ["feo", "tonto", "idiota", "cobarde", "basura", "malo", "horrible", "estúpido", "inútil", "patético", "débil", "triste", "enojado", "terrible"] },
  { nombre: "ayuda",          claves: ["ayuda", "socorro", "auxilio", "necesito ayuda", "ayúdame"] },
  { nombre: "felicitaciones", claves: ["felicidades", "enhorabuena", "bravo", "excelente", "bien hecho", "gran trabajo"] },
  { nombre: "magia",          claves: ["magia", "hechizo", "poderes", "encantamiento", "conjuro"] }
];

// Busca la frase completa dentro del texto (sirve para claves de varias palabras)
function contiene(textoNormalizado, frase) {
  return (" " + textoNormalizado + " ").includes(" " + normalizar(frase) + " ");
}

function detectarIntencion(texto) {
  const limpio = normalizar(texto);
  for (const intencion of INTENCIONES) {
    if (intencion.claves.some(c => contiene(limpio, c))) return intencion.nombre;
  }
  return "desconocida";          // si no entendió nada
}

const RESPUESTAS = {
  saludo: {
    bien: "¡Saludos, viajero! Hacía siglos que nadie me hablaba con respeto.",
    mal:  "Grrr... ¿Qué quieres, pequeño humano?"
  },
  llave: {
    bien: "¿La llave? Me caes bien... pero demuéstrame que eres de fiar.",
    mal:  "¡La llave es MÍA! Vuelve cuando aprendas modales."
  },
  nombre: {
    bien: "Me llaman Ignis el Paciente. ¿Y tú?",
    mal:  "Mi nombre es 'Aléjate'."
  },
  chiste: {
    bien: "¿Por qué el dragón no usa WiFi? ¡Porque quema la conexión! Ja, ja.",
    mal:  "No estoy de humor para chistes. Tu cara ya es suficiente broma."
  },
  comida: {
    bien: "Mmm, oveja asada... Hace tiempo que no como bien. Qué amable eres.",
    mal:  "¿Comida? Estoy pensando en comerte A TI."
  },
  despedida: {
    bien: "Vuelve pronto, viajero. Tienes buena energía.",
    mal:  "¡Largo de aquí!"
  },
  agradecimiento: {
    bien: "Vaya, ¡qué educado! Hacía mucho que nadie me daba las gracias.",
    mal:  "¿Gracias? No creas que me vas a engañar con buenos modales."
  },
  insulto: {
    bien: "¿Insultarme? Qué interesante. Pero no me gustan los malos modales.",
    mal:  "¡No me hables así! ¡Soy un dragón, no un perro!"
  },
  ayuda: {
    bien: "¡Claro que te ayudo! ¿En qué puedo ayudarte?",
    mal:  "No tengo tiempo para tonterías. ¡Vete!"
  },
  felicitaciones: {
    bien: "¡Gracias por tus palabras de aliento! Me alegra que te guste mi trabajo.",
    mal:  "No me gusta recibir elogios. ¡Soy un dragón, no un perro!"
  },
  magia: {
    bien: "¿Magia? Conozco hechizos antiguos... si sigues siendo amable, quizá te enseñe uno.",
    mal:  "¿Quieres magia? ¡Te convertiré en sapo si sigues así!"
  },
  desconocida: {
    bien: "No te entendí del todo, pero tu tono es agradable. Prueba otra cosa.",
    mal:  "No entiendo nada de lo que dices. Y no me gusta tu tono."
  }
};

// ---------- IA en la nube (Bloque 8) ----------
// Le pide la respuesta al servidor (no a NVIDIA directamente).
// Si algo falla devuelve null y el juego usa el diccionario como plan B.
async function consultarDragonIA(texto, historial) {
  try {
    const respuesta = await fetch("/api/dragon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: texto, historial }),
      signal: AbortSignal.timeout(20000)
    });
    if (!respuesta.ok) return null;
    return await respuesta.json();     // { sentimiento: -10..10 (o null), respuesta: "..." }
  } catch (error) {
    return null;
  }
}