// ═══════════════════════════════════════════════════════════
// WAVE BASS RAVE — interacciones
// Este archivo no define estilos: solo agrega o saca clases.
// ═══════════════════════════════════════════════════════════


// ─── Aparición al scrollear ───
// Cada elemento aparece una sola vez, cuando asoma en pantalla, y
// se queda visible para siempre. No hay animación de salida: si los
// elementos van y vienen con cada scroll, la página se siente
// inestable y el navegador trabaja de más en cada cuadro.

const elementos = document.querySelectorAll('.aparece');

// Los elementos de una misma sección aparecen en cascada, salvo los
// títulos, que entran de una para no perder la referencia visual
const porSeccion = new Map();

elementos.forEach((el) => {
  const seccion = el.closest('.seccion__contenido') || document.body;
  if (!porSeccion.has(seccion)) porSeccion.set(seccion, []);
  porSeccion.get(seccion).push(el);
});

porSeccion.forEach((grupo) => {
  grupo.forEach((el, i) => {
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
    observador.unobserve(target); // ya está: no lo miramos más
  });
}, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

elementos.forEach((el) => observador.observe(el));


// ─── Fundido de las imágenes al terminar de cargar ───
// Arrancan invisibles (ver styles.scss) para que no aparezcan de
// golpe sobre el fondo del contenedor.

document.querySelectorAll('img').forEach((img) => {
  if (img.complete) return img.classList.add('cargada');

  const mostrar = () => img.classList.add('cargada');
  img.addEventListener('load', mostrar);
  img.addEventListener('error', mostrar); // si falla, igual la mostramos
});


// ─── Traductor español / inglés ───
// Cada elemento traducible lleva data-en con su versión en inglés.
// Los campos de formulario usan data-en-ph para el placeholder.
// Al cargar guardamos el texto original para poder volver atrás.

const boton = document.getElementById('idioma');

const textos = document.querySelectorAll('[data-en]');
const campos = document.querySelectorAll('[data-en-ph]');

textos.forEach((el) => (el.dataset.es = el.textContent));
campos.forEach((el) => (el.dataset.esPh = el.placeholder));

let ingles = false;

boton.addEventListener('click', () => {
  ingles = !ingles;

  textos.forEach((el) => {
    el.textContent = ingles ? el.dataset.en : el.dataset.es;
  });

  campos.forEach((el) => {
    el.placeholder = ingles ? el.dataset.enPh : el.dataset.esPh;
  });

  boton.textContent = ingles ? 'EN / ES' : 'ES / EN';
  document.documentElement.lang = ingles ? 'en' : 'es';
});