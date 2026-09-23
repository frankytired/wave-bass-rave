/**
 * Wave Bass Rave — comportamiento del sitio
 *
 * El archivo no define estilos: solo agrega o quita clases, que el
 * CSS traduce a transiciones. Cada módulo es independiente y
 * comprueba que su elemento exista antes de engancharse, de modo que
 * quitar una sección del marcado no rompe el resto.
 *
 * Se carga con defer, así que el DOM ya está construido y no hace
 * falta esperar a DOMContentLoaded.
 *
 * MÓDULOS
 *   1. Animación de entrada al scrollear
 *   2. Video de portada
 *   3. Fundido de imágenes
 *   4. Visor de galería
 *   5. Menú móvil
 *   6. Traductor ES / EN
 */


/* ── 1. Animación de entrada al scrollear ───────────────────
 *
 * Cada elemento con .aparece se revela una sola vez, cuando asoma en
 * pantalla, y deja de observarse. No hay animación de salida: los
 * elementos que van y vienen desestabilizan la lectura y obligan al
 * navegador a recalcular en cada cuadro del scroll.
 */

const elementos = document.querySelectorAll('.aparece');

// Los elementos de una misma sección entran escalonados. Los títulos
// (.aparece--fijo) quedan exentos: cualquier retraso en ellos hace
// perder la referencia de en qué sección se está.
const porSeccion = new Map();

elementos.forEach((el) => {
  const seccion = el.closest('.seccion__contenido') || document.body;

  if (!porSeccion.has(seccion)) porSeccion.set(seccion, []);
  porSeccion.get(seccion).push(el);
});

porSeccion.forEach((grupo) => {
  grupo.forEach((el, i) => {
    // El tope de 5 evita que los últimos elementos de una lista larga
    // acumulen un retraso perceptible
    const retraso = el.classList.contains('aparece--fijo')
      ? 0
      : Math.min(i, 5) * 0.09;

    el.style.setProperty('--delay', `${retraso}s`);
  });
});

const observador = new IntersectionObserver((entradas) => {
  entradas.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return;

    target.classList.add('visible');
    observador.unobserve(target);
  });
}, {
  threshold: 0,
  // El margen negativo inferior retrasa el disparo hasta que el
  // elemento entró de verdad, no apenas roza el borde
  rootMargin: '0px 0px -10% 0px'
});

elementos.forEach((el) => observador.observe(el));


/* ── 2. Video de portada ────────────────────────────────────
 *
 * El src se asigna desde acá y no en el marcado: en pantallas chicas
 * el archivo no se descarga y queda el poster. El video pesa varios
 * MB, se consume sobre datos móviles y bajo el velo de color aporta
 * poco en esa resolución.
 */

const video = document.getElementById('video-portada');
const pantallaChica = window.matchMedia('(max-width: 780px)').matches;

if (video && !pantallaChica) {
  video.src = video.dataset.video;
  video.load();
}


/* ── 3. Fundido de imágenes ─────────────────────────────────
 *
 * Las imágenes arrancan en opacity 0 (ver %caja-media) y se revelan
 * al terminar de descargarse, para que no aparezcan de golpe sobre el
 * fondo del contenedor.
 */

document.querySelectorAll('img').forEach((img) => {
  // complete es true si viene de caché: en ese caso load ya no dispara
  if (img.complete) {
    img.classList.add('cargada');
    return;
  }

  const revelar = () => img.classList.add('cargada');

  img.addEventListener('load', revelar);
  // Ante un error también se revela: deja ver el ícono de imagen rota
  // en lugar de un hueco silencioso difícil de diagnosticar
  img.addEventListener('error', revelar);
});


/* ── 4. Visor de galería ────────────────────────────────────
 *
 * Amplía las fotos sobre un overlay. El overlay se construye acá
 * porque existe solo para esta interacción y no es contenido del
 * documento: mantenerlo fuera del marcado evita un bloque muerto en
 * el HTML y que los buscadores lo indexen como contenido.
 */

const fotos = [...document.querySelectorAll('.galeria__foto img')];

if (fotos.length) {
  const visor = document.createElement('div');
  visor.className = 'visor';
  visor.innerHTML = `
    <button class="visor__cerrar" type="button" aria-label="Cerrar">&times;</button>
    <button class="visor__anterior" type="button" aria-label="Anterior">&#8249;</button>
    <img class="visor__imagen" alt="">
    <button class="visor__siguiente" type="button" aria-label="Siguiente">&#8250;</button>
    <p class="visor__contador"></p>`;
  document.body.appendChild(visor);

  const imagen = visor.querySelector('.visor__imagen');
  const contador = visor.querySelector('.visor__contador');
  let actual = 0;

  // El módulo sobre la cantidad de fotos hace que el recorrido sea
  // circular en ambos sentidos, incluso con índices negativos
  const mostrar = (i) => {
    actual = (i + fotos.length) % fotos.length;

    imagen.src = fotos[actual].src;
    imagen.alt = fotos[actual].alt;
    contador.textContent = `${actual + 1} / ${fotos.length}`;
  };

  const abrir = (i) => {
    mostrar(i);
    visor.classList.add('visor--abierto');
    document.body.classList.add('sin-scroll');
  };

  const cerrar = () => {
    visor.classList.remove('visor--abierto');
    document.body.classList.remove('sin-scroll');
  };

  fotos.forEach((foto, i) => {
    const contenedor = foto.parentElement;

    // El figure no es enfocable por defecto: se lo declara como botón
    // para que el visor también se abra con teclado
    contenedor.tabIndex = 0;
    contenedor.setAttribute('role', 'button');

    contenedor.addEventListener('click', () => abrir(i));
    contenedor.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;

      e.preventDefault();  // la barra espaciadora scrollea por defecto
      abrir(i);
    });
  });

  visor.querySelector('.visor__cerrar').addEventListener('click', cerrar);
  visor.querySelector('.visor__anterior').addEventListener('click', () => mostrar(actual - 1));
  visor.querySelector('.visor__siguiente').addEventListener('click', () => mostrar(actual + 1));

  // Solo cierra al tocar el fondo: comparar contra currentTarget deja
  // fuera los clics sobre la imagen y los controles
  visor.addEventListener('click', (e) => {
    if (e.target === visor) cerrar();
  });

  document.addEventListener('keydown', (e) => {
    if (!visor.classList.contains('visor--abierto')) return;

    if (e.key === 'Escape')     cerrar();
    if (e.key === 'ArrowLeft')  mostrar(actual - 1);
    if (e.key === 'ArrowRight') mostrar(actual + 1);
  });
}


/* ── 5. Menú móvil ──────────────────────────────────────────
 *
 * aria-expanded cumple dos funciones: informa el estado a los
 * lectores de pantalla y le sirve al CSS como selector para
 * transformar las barras en una X. Por eso el estado no se duplica en
 * una clase aparte.
 */

const menuBoton = document.getElementById('menu-boton');
const menu = document.getElementById('menu');

if (menuBoton && menu) {
  const etiquetas = {
    es: { abrir: 'Abrir menú', cerrar: 'Cerrar menú' },
    en: { abrir: 'Open menu',  cerrar: 'Close menu' }
  };

  const idiomaActual = () => (document.documentElement.lang === 'en' ? 'en' : 'es');

  const actualizarBoton = (abierto) => {
    menuBoton.setAttribute('aria-expanded', String(abierto));
    menuBoton.setAttribute(
      'aria-label',
      etiquetas[idiomaActual()][abierto ? 'cerrar' : 'abrir']
    );
  };

  const cerrarMenu = () => {
    menu.classList.remove('nav__menu--abierto');
    actualizarBoton(false);
  };

  menuBoton.addEventListener('click', () => {
    actualizarBoton(menu.classList.toggle('nav__menu--abierto'));
  });

  // Al elegir una sección el panel se cierra solo
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) cerrarMenu();
  });

  // Y también al tocar fuera de la barra o al presionar Escape
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav')) cerrarMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarMenu();
  });
}


/* ── 6. Traductor ES / EN ───────────────────────────────────
 *
 * Las traducciones viven junto al contenido, en atributos del propio
 * elemento, en lugar de un diccionario aparte: así un texto nuevo se
 * traduce donde se escribe y no quedan claves huérfanas.
 *
 *   data-en     → texto del elemento
 *   data-en-ph  → placeholder de un campo de formulario
 *
 * El texto en castellano se guarda al cargar la página para poder
 * restituirlo sin duplicarlo en el marcado.
 */

const botonIdioma = document.getElementById('idioma');

if (botonIdioma) {
  const textos = document.querySelectorAll('[data-en]');
  const campos = document.querySelectorAll('[data-en-ph]');

  textos.forEach((el) => { el.dataset.es = el.textContent; });
  campos.forEach((el) => { el.dataset.esPh = el.placeholder; });

  let ingles = false;

  botonIdioma.addEventListener('click', () => {
    ingles = !ingles;

    textos.forEach((el) => {
      el.textContent = ingles ? el.dataset.en : el.dataset.es;
    });

    campos.forEach((el) => {
      el.placeholder = ingles ? el.dataset.enPh : el.dataset.esPh;
    });

    botonIdioma.textContent = ingles ? 'EN / ES' : 'ES / EN';

    // El atributo lang orienta a lectores de pantalla y buscadores, y
    // además es lo que consulta el menú móvil para sus etiquetas
    document.documentElement.lang = ingles ? 'en' : 'es';
  });
}