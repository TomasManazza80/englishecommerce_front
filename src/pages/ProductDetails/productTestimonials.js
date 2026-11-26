const NAMES = [
  ["Rodrigo Canales", "Santiago, Chile", "m"], ["Valeria Morales", "Bogotá", "f"], ["Javier Arancibia", "Madrid", "m"],
  ["Camila Ferreyra", "Córdoba, AR", "f"], ["Martín Olivares", "Ciudad de México", "m"], ["Lucía Benítez", "Montevideo", "f"],
  ["Sebastián Rojas", "Lima", "m"], ["Florencia Gaitán", "Buenos Aires", "f"], ["Diego Paredes", "Quito", "m"],
  ["Mariana Quiroga", "Mendoza", "f"], ["Tomás Villalba", "Asunción", "m"], ["Agustina Sosa", "Rosario", "f"],
  ["Nicolás Herrera", "Medellín", "m"], ["Paula Contreras", "Valparaíso", "f"], ["Federico Ibarra", "Guadalajara", "m"],
  ["Sofía Medina", "Barcelona", "f"], ["Joaquín Peralta", "La Plata", "m"], ["Renata Aguirre", "Monterrey", "f"],
  ["Matías Cabrera", "Punta del Este", "m"], ["Julieta Navarro", "Sevilla", "f"], ["Andrés Molina", "Cali", "m"],
  ["Carolina Vidal", "San José, CR", "f"], ["Gonzalo Fuentes", "Neuquén", "m"], ["Antonella Ríos", "Salta", "f"],
  ["Ignacio Luna", "Concepción", "m"], ["Daniela Castro", "Caracas", "f"], ["Emiliano Duarte", "Tucumán", "m"],
  ["Victoria Romero", "Miami", "f"], ["Bruno Acosta", "Mar del Plata", "m"], ["Micaela Torres", "Panamá", "f"],
];

const POOLS = {
  viajes: {
    keys: ["viaje", "turismo", "travel", "viajero", "aeropuerto"],
    items: [
      ["Viajé sola a Londres y pude hacer el check-in, pedir indicaciones y resolver un vuelo cancelado sin trabarme. Las frases de emergencia me salvaron.", "Viajera frecuente", "f"],
      ["Antes de {curso} señalaba con el dedo en los restaurantes. En Nueva York pedí, pregunté por alérgenos y hasta charlé con el mozo.", "Contador • de vacaciones en EE.UU.", "m"],
      ["El mini diccionario en el celular fue clave en el aeropuerto de Dublín. Encontré mi puerta de embarque y cambié mi asiento sin estrés.", "Estudiante de intercambio", "n"],
      ["Hice un road trip por California y alquilé el auto, negocié en el hotel y pedí ayuda en la ruta. Me sentí independiente por primera vez.", "Fotógrafo freelance", "m"],
      ["Los videos grabados en locaciones reales me prepararon para el acento australiano. En Sídney entendí todo desde el primer día.", "Backpacker • Working Holiday", "n"],
    ],
  },
  negocios: {
    keys: ["negocio", "business", "entrevista", "corporat", "empresa", "laboral", "trabajo", "liderazgo", "leadership", "oratoria"],
    items: [
      ["Tenía un bloqueo enorme cada vez que el VP en San Francisco me pedía opinión. En tres semanas perdí la vergüenza y ahora dirijo los comités semanales.", "Tech Lead • Remoto en EE.UU.", "n"],
      ["Las simulaciones de entrevistas me hicieron repetir mi respuesta sobre conflictos hasta que sonó firme y natural. Me contrataron en una empresa de Londres.", "Product Designer • Fintech UK", "n"],
      ["Aprendí a redactar emails ejecutivos sin traducir palabra por palabra. Mi jefe en Toronto notó el cambio en la segunda semana.", "Analista Comercial", "n"],
      ["Presenté resultados trimestrales en inglés frente al board sin leer diapositivas. {curso} me dio las estructuras exactas que necesitaba.", "Gerente de Operaciones", "n"],
      ["Negocié un contrato con un proveedor alemán en inglés y cerré mejores condiciones. El vocabulario de negociación es oro puro.", "Consultor Financiero", "m"],
    ],
  },
  examen: {
    keys: ["ielts", "toefl", "cambridge", "examen", "exam", "certific", "fce", "cae"],
    items: [
      ["Pasé de 6.0 a 7.5 en IELTS en dos meses. Los simulacros cronometrados me enseñaron a gestionar el tiempo en Writing.", "Postulante a Maestría en UK", "n"],
      ["Mi punto débil era el Speaking del TOEFL. Con la práctica guiada subí 6 puntos y conseguí la beca que buscaba.", "Ingeniera • Becada en Canadá", "f"],
      ["Las estrategias de Reading cambiaron mi forma de leer: dejé de traducir y empecé a escanear. Aprobé el FCE con distinción.", "Estudiante universitario", "m"],
      ["La corrección detallada de cada essay me mostró errores que repetía hace años. Obtuve el puntaje para mi visa de residencia.", "Enfermero • Migrando a Australia", "m"],
      ["Hice {curso} mientras trabajaba full time. El plan de estudio semanal fue realista y llegué al examen confiado.", "Desarrollador de Software", "m"],
    ],
  },
  docentes: {
    keys: ["docente", "teacher", "teaching", "pedagog", "profesor"],
    items: [
      ["Renové por completo mis clases. Las metodologías activas hicieron que mis alumnos de secundaria participen como nunca.", "Profesora de Inglés • Secundaria", "f"],
      ["La fonética aplicada al aula me dio herramientas concretas para corregir pronunciación sin frenar la clase.", "Docente de Instituto de Idiomas", "n"],
      ["Incorporé herramientas de IA para generar material y ahora preparo mis clases en la mitad del tiempo.", "Profesor particular", "m"],
      ["{curso} me ayudó a estructurar mis clases online. Pasé de 5 a 22 alumnos en cuatro meses.", "Teacher freelance", "n"],
      ["Las planificaciones listas para usar y las dinámicas de grupo fueron un antes y un después en mi escuela.", "Coordinadora Académica", "f"],
    ],
  },
  gramatica: {
    keys: ["gramát", "gramat", "grammar", "mapa", "tiempos verbales", "estructura"],
    items: [
      ["Por fin entendí la diferencia entre present perfect y past simple. Los mapas visuales me lo dejaron clarísimo en una tarde.", "Estudiante de Comercio Exterior", "n"],
      ["Tengo los mapas impresos en mi escritorio y los consulto cada vez que escribo un email. Dejé de dudar con los condicionales.", "Asistente Administrativa", "f"],
      ["Estudié años con libros eternos. {curso} resume todo en esquemas simples con ejemplos reales. Repasé toda la gramática en dos semanas.", "Abogado", "m"],
      ["Los uso para preparar mis clases y mis alumnos los aman. Explicar la voz pasiva nunca fue tan fácil.", "Profesora de Inglés", "f"],
      ["Me ayudaron a ordenar todo lo que sabía suelto. Ahora armo oraciones complejas sin miedo a equivocarme.", "Estudiante de Ingeniería", "n"],
    ],
  },
  speaking: {
    keys: ["conversa", "fluidez", "speaking", "pronuncia", "fonét", "fonet", "hablar", "listening"],
    items: [
      ["Practicar a las 11 de la noche sin cuadrar horarios con un profesor cambió todo. La detección de muletillas me hizo sonar mucho más natural.", "Diseñador UX", "m"],
      ["Entendía todo pero no podía hablar. Con los diálogos guiados empecé a responder sin traducir en mi cabeza.", "Médica Residente", "f"],
      ["El feedback de pronunciación me mostró que decía mal palabras que usaba todos los días. Ahora me entienden a la primera.", "Soporte Técnico • Cliente en EE.UU.", "n"],
      ["En un mes de {curso} tuve mi primera videollamada de 30 minutos en inglés sin pausas incómodas.", "Emprendedora e-commerce", "f"],
      ["Las situaciones de la vida real me dieron frases que uso todos los días con mis compañeros de trabajo en Irlanda.", "Barista • Dublín", "n"],
    ],
  },
  lectura: {
    keys: ["novela", "lectura", "reading", "libro", "historia", "cuento"],
    items: [
      ["Leer historias graduadas por nivel me hizo ganar vocabulario sin darme cuenta. Ya terminé mi primera novela completa en inglés.", "Estudiante de Letras", "n"],
      ["Leo un capítulo cada noche antes de dormir. El audio sincronizado me ayudó muchísimo con la pronunciación.", "Contadora", "f"],
      ["{curso} me devolvió las ganas de leer en inglés. Las historias atrapan y el nivel está muy bien calibrado.", "Docente de Primaria", "n"],
      ["Las notas de vocabulario al pie me evitaron estar con el traductor todo el tiempo. Disfruto la lectura de verdad.", "Ingeniero Civil", "m"],
      ["Mi hija y yo leemos juntas las historias. Es nuestro momento favorito del día y las dos mejoramos.", "Mamá y estudiante", "f"],
    ],
  },
  ninos: {
    keys: ["niño", "nino", "kids", "infantil", "chicos", "children"],
    items: [
      ["Mi hijo de 8 años pide hacer las actividades él solo. Ya canta canciones en inglés y reconoce los colores y animales.", "Mamá de Benjamín (8)", "f"],
      ["Los juegos mantienen la atención de mi hija, cosa que ninguna academia logró. En dos meses aprendió más de 100 palabras.", "Papá de Emma (6)", "m"],
      ["Lo uso con mis alumnos de primer grado y es un éxito. {curso} es colorido, simple y muy bien pensado.", "Maestra de Nivel Inicial", "f"],
      ["Mis mellizos compiten por ver quién responde primero. Aprenden jugando y yo no tengo que estar encima.", "Mamá de Tobías y Lola (7)", "f"],
      ["La pronunciación de mi hijo mejoró muchísimo gracias a los audios con voces nativas.", "Papá de Thiago (9)", "m"],
    ],
  },
  vocabulario: {
    keys: ["vocabulario", "vocabulary", "phrasal", "palabras", "expresion", "slang"],
    items: [
      ["Los phrasal verbs eran mi pesadilla. Con las tarjetas y ejemplos reales ya los uso naturalmente en conversaciones.", "Community Manager", "n"],
      ["Repaso 10 minutos por día en el colectivo y mi vocabulario creció muchísimo. Ahora entiendo series sin subtítulos.", "Estudiante de Diseño", "n"],
      ["{curso} me enseñó expresiones que nunca aparecen en los libros pero que los nativos usan todo el tiempo.", "Recepcionista de Hotel", "n"],
      ["Las listas temáticas me ayudaron a prepararme para mi trabajo nuevo en una empresa americana.", "Analista de Datos", "n"],
      ["Dejé de repetir siempre las mismas palabras. Mis emails ahora suenan más variados y profesionales.", "Ejecutiva de Cuentas", "f"],
    ],
  },
  tech: {
    keys: ["programa", "tech", "developer", "software", "it ", "código", "codigo", "ingenier"],
    items: [
      ["Por fin puedo leer documentación técnica y participar en las dailies sin quedarme callado. Conseguí mi primer trabajo remoto.", "Frontend Developer", "n"],
      ["Las simulaciones de entrevistas técnicas en inglés fueron clave. Expliqué mi proyecto con confianza y pasé todas las etapas.", "Backend Developer • Remoto", "n"],
      ["{curso} tiene el vocabulario exacto que uso en code reviews y en Slack con mi equipo de Estados Unidos.", "QA Engineer", "n"],
      ["Ahora escribo pull requests y tickets claros en inglés. Mi tech lead me felicitó por la mejora.", "Desarrollador Full Stack", "m"],
      ["Pasé de evitar las reuniones con clientes a liderarlas. Me ascendieron a Team Lead este año.", "Team Lead • Software Factory", "n"],
    ],
  },
  general: {
    keys: [],
    items: [
      ["Probé muchas apps y academias, pero con {curso} fue la primera vez que sentí un progreso real semana a semana.", "Administrativo", "m"],
      ["Los contenidos son claros y van directo a lo importante. Avanzo a mi ritmo y nunca me sentí perdida.", "Estudiante universitaria", "f"],
      ["Pude estudiar en mis tiempos libres y en tres meses noté una diferencia enorme en mi confianza.", "Vendedor", "m"],
      ["La relación precio-calidad es increíble. Material profesional, bien explicado y con soporte cuando lo necesité.", "Emprendedora", "f"],
      ["Me animé a postularme a trabajos que pedían inglés. Hoy trabajo para una empresa internacional.", "Analista de RRHH", "n"],
    ],
  },
};

const ORDER = ["ninos", "docentes", "examen", "tech", "gramatica", "lectura", "vocabulario", "viajes", "negocios", "speaking"];

const hash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
};

const toTitle = (s = "") =>
  s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()).split(/[-–:]/)[0].trim();

export const getProductTestimonials = (product) => {
  if (!product) return [];
  const text = `${product.nombre || ""} ${product.categoria || ""} ${product.descripcion || ""}`.toLowerCase();
  const nameText = `${product.nombre || ""} ${product.categoria || ""}`.toLowerCase();

  const type =
    ORDER.find((k) => POOLS[k].keys.some((kw) => nameText.includes(kw))) ||
    ORDER.find((k) => POOLS[k].keys.some((kw) => text.includes(kw))) ||
    "general";

  const seed = hash(`${product.id ?? ""}-${product.nombre ?? ""}`);
  const items = POOLS[type].items;
  const curso = toTitle(product.nombre) || "este curso";
  const used = new Set();

  return [0, 1, 2].map((i) => {
    const [quote, role, gender] = items[(seed + i * 2) % items.length];
    let n = (seed * 7 + i * 11) % NAMES.length;
    while (used.has(n) || (gender !== "n" && NAMES[n][2] !== gender)) n = (n + 1) % NAMES.length;
    used.add(n);
    const [name, city] = NAMES[n];
    return {
      quote: quote.replace("{curso}", curso),
      name,
      role: `${role} • ${city}`,
      initials: name.split(" ").map((p) => p[0]).join(""),
    };
  });
};
