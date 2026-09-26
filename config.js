/* =====================================================================
   DATOS GENERALES DE LA WEB: edita solo lo que está entre comillas.
   ===================================================================== */
const CONFIG = {
  nombreWeb: "Repositorio de Papers",           // aparece en el menú, la pestaña del navegador y el pie
  email:     "tu-email@ejemplo.com",            // correo al que llegan los mensajes del formulario de Contacto
  formspree: ""   // opcional: código de Formspree (p. ej. "xyzabcd") para recibir el formulario sin abrir el correo
};
/* ===================================================================== */

/* ---- A partir de aquí no hace falta tocar nada ---- */
const PDF_FOLDER = "pdfs/";
const DATA_FILE  = "papers.csv";

const norm = s => (s||"").toString().normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
const esc  = s => (s||"").toString().replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* Menú, título de la pestaña y pie comunes a todas las páginas */
(function(){
  const page = document.body.dataset.page;
  const tabs = [["index.html","Inicio","inicio"],["papers.html","Papers","papers"],["contacto.html","Contacto","contacto"]];
  document.querySelector("#nav").innerHTML =
    `<div class="wrap"><a class="brand" href="index.html">${esc(CONFIG.nombreWeb)}</a>
     <nav class="tabs">${tabs.map(([h,l,k])=>`<a href="${h}"${k===page?' aria-current="page"':""}>${l}</a>`).join("")}</nav></div>`;
  document.querySelector("footer .wrap").textContent = `© ${new Date().getFullYear()} · ${CONFIG.nombreWeb}`;
  const t = document.title; document.title = t ? `${t} · ${CONFIG.nombreWeb}` : CONFIG.nombreWeb;
})();

/* Lee papers.csv (acepta comas o punto y coma, UTF-8 o formato de Excel) */
function parseCSV(text){
  text = text.replace(/^﻿/,"");
  const first = text.split(/\r?\n/)[0];
  const d = (first.split(";").length > first.split(",").length) ? ";" : ",";
  const rows=[]; let row=[], f="", q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; }
    else if(c==='"') q=true;
    else if(c===d){ row.push(f); f=""; }
    else if(c==="\n"||c==="\r"){ if(c==="\r"&&text[i+1]==="\n") i++; row.push(f); rows.push(row); row=[]; f=""; }
    else f+=c;
  }
  if(f!==""||row.length){ row.push(f); rows.push(row); }
  const head = rows.shift().map(norm);
  const idx = k => head.findIndex(h => h.startsWith(k));
  const I = { t:idx("titulo"), a:idx("autor"), y:idx("ano"), g:idx("tematica"), r:idx("resumen"), f:idx("archivo") };
  return rows.filter(r => r.some(x => x.trim())).map(r => ({
    titulo:(r[I.t]||"").trim(), autores:(r[I.a]||"").trim(), anio:(r[I.y]||"").trim(),
    tematica:(r[I.g]||"").trim(), resumen:I.r>-1?(r[I.r]||"").trim():"", archivo:(r[I.f]||"").trim()
  }));
}

async function loadPapers(){
  const res = await fetch(DATA_FILE + "?v=" + Date.now());
  if(!res.ok) throw new Error("No se encontró " + DATA_FILE);
  const buf = await res.arrayBuffer();
  let text;
  try{ text = new TextDecoder("utf-8",{fatal:true}).decode(buf); }
  catch{ text = new TextDecoder("windows-1252").decode(buf); }
  return parseCSV(text);
}

const LOAD_ERROR = `<div class="error"><strong>No se ha podido cargar la lista de papers.</strong><br>
  Si has abierto este archivo directamente desde tu ordenador, es normal: el navegador bloquea la lectura de <code>papers.csv</code>.
  La web funcionará en cuanto esté publicada en GitHub Pages.</div>`;

const pdfHref = p => /^https?:\/\//.test(p.archivo) ? p.archivo : PDF_FOLDER + encodeURIComponent(p.archivo);
