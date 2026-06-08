import React, { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";

const Cal = React.lazy(() =>
  import("@calcom/embed-react").then((m) => ({ default: m.default }))
);

const CALCOM_LINK = import.meta.env.VITE_CALCOM_LINK ?? "pintasso-cl/visita-tecnica";
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

// ── Static data ───────────────────────────────────────────────────────────────

const steps = [
  {
    step: "01",
    title: "Levantamiento Digital",
    desc: "Medición digital exacta del espacio y captura fotográfica con iluminación controlada. Sin visitas innecesarias ni estimaciones aproximadas.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Render Fotorrealista",
    desc: "Disposición visual proyectada sobre sus muros reales en menos de 24 horas. Vea colores, texturas y composición antes de decidir.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Cierre Sin Sorpresas",
    desc: "Apruebe diseño y presupuesto desde su panel digital privado. Contrato formal, factura electrónica y fecha de inicio confirmada.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const services = [
  {
    symbol: "◈",
    tag: "Residencial · Corporativo",
    title: "Pintura Tradicional de Alta Gama",
    desc: "Aplicación con pistola airless profesional para acabados impecables en fachadas, interiores, oficinas corporativas y condominios residenciales.",
    features: [
      "Acabado airless sin marcas de rodillo",
      "Preparación de superficie certificada",
      "Pinturas de primera línea (Sipa, Sherwin-Williams)",
      "Cobertura total garantizada",
    ],
  },
  {
    symbol: "◇",
    tag: "Diseño · Arquitectura Interior",
    title: "Muros de Acento",
    desc: "Precisión geométrica y contrastes de color limpios que delimitan espacios de forma lógica y estética. Transformación radical con impacto inmediato.",
    features: [
      "Trazado geométrico de precisión milimétrica",
      "Paleta de color personalizada",
      "Integración con iluminación existente",
      "Diseño validado por render previo",
    ],
  },
  {
    symbol: "◉",
    tag: "Arte · Branding · Experiencia",
    title: "Muralismo y Graffiti Corporativo",
    desc: "Diseños exclusivos para livingrooms premium, cafés boutique, gimnasios y restaurantes. Arte que comunica identidad de marca.",
    features: [
      "Diseño conceptual incluido",
      "Pinturas UV-resistentes para exteriores",
      "Ejecución por artistas certificados",
      "Portfolio digital del proceso",
    ],
  },
];

const guarantees = [
  {
    symbol: "◈",
    title: "Presupuesto Cerrado",
    pain: "El problema típico",
    painDesc: '"El material subió de precio, necesitamos más fondos."',
    solutionDesc:
      "Costos calculados con modelos internos exactos. El precio cotizado es el precio final. Sin escaladas de materiales. Sin cobros sorpresa al cierre.",
  },
  {
    symbol: "◇",
    title: "Cumplimiento Estricto",
    pain: "El problema típico",
    painDesc: '"Esta semana no puedo, tuve otro trabajo más urgente."',
    solutionDesc:
      "Contrato formal con fecha de inicio y término garantizada. Factura electrónica emitida. Cronograma en su panel digital con actualizaciones en tiempo real.",
  },
  {
    symbol: "◉",
    title: "Logística Propia",
    pain: "El problema típico",
    painDesc: '"Mi ayudante no llegó hoy, reiniciamos mañana."',
    solutionDesc:
      "Transporte corporativo 100% propio. Equipos y herramientas profesionales sin dependencias externas. Equipo interno sin subcontratistas improvisados.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { getCalApi } = await import("@calcom/embed-react");
      if (!alive) return;

      const cal = await getCalApi({ namespace: "diagnostico" });
      if (!alive) return;

      cal("on", {
        action: "bookingSuccessful",
        callback: async (e: CustomEvent) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const booking = (e as any).detail?.data?.booking;
          const bookingId = String(booking?.uid ?? booking?.id ?? "").trim();
          if (!bookingId) return;

          const attendee = booking?.attendees?.[0];
          const name: string = String(attendee?.name ?? "").trim();
          const email: string = String(attendee?.email ?? "").trim();

          setConfirming(true);

          if (API_URL) {
            try {
              await fetch(`${API_URL}/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId, name, email }),
              });
            } catch {
              // Proceed to success even if email notification fails
            }
          }

          navigate(
            `/success?order=${encodeURIComponent(bookingId)}` +
              `&name=${encodeURIComponent(name)}` +
              `&email=${encodeURIComponent(email)}`
          );
        },
      });
    })();

    return () => { alive = false; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-base-100 text-base-content">

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header className="navbar bg-white backdrop-blur-lg sticky top-0 z-50 border-b border-base-200 px-4 lg:px-8">
        <div className="navbar-start">
          <a href="/" className="hover:animate-pulse">
            <img src="/logo.png" alt="Pintasso" className="w-36 h-12 object-cover" />
          </a>
        </div>

        <nav className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal gap-1 text-sm">
            <li><a href="#experiencia">Experiencia Digital</a></li>
            <li><a href="#servicios">Servicios</a></li>
            <li><a href="#garantias">Garantías</a></li>
            <li><a href="#agenda">Agenda</a></li>
          </ul>
        </nav>

        <div className="navbar-end gap-2">
          <a href="#agenda" className="btn btn-primary btn-sm hidden lg:flex">
            Agendar Diagnóstico
          </a>
          <div className="dropdown dropdown-end lg:hidden">
            <label tabIndex={0} className="btn btn-ghost btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box w-52 p-2 shadow-lg z-50 border border-base-300">
              <li><a href="#experiencia">Experiencia Digital</a></li>
              <li><a href="#servicios">Servicios</a></li>
              <li><a href="#garantias">Garantías</a></li>
              <li><a href="#agenda">Agendar Diagnóstico</a></li>
            </ul>
          </div>
        </div>
      </header>

      <main>
        {/* ── HERO ────────────────────────────────────────────────────────────── */}
        <section
          className="relative hero"
          style={{
            backgroundImage:
              "url(https://pub-32b1cda619ea4beb87ec430bc7b9eb80.r2.dev/pintassocl/Ombre%20Pink%20and%20Purple%20Accent%20Wall%20for%20Teen%20Bedrooms.jpg)",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <div className="hero-overlay bg-neutral/50" />
          <div className="hero-content text-neutral-content text-center py-12">
            <div className="max-w-4xl">
              <div className="badge badge-neutral mb-8 px-5 text-xs tracking-widest uppercase font-semibold">
                Temuco · Región de La Araucanía
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black leading-tight mb-8">
                Vea su espacio{" "}
                <span className="text-primary">transformado</span> antes de
                aplicar la primera gota de pintura.
              </h1>
              <p className="text-lg sm:text-xl text-neutral-content max-w-2xl mx-auto mb-6 leading-relaxed">
                Pintura de alta gama con plazos estrictos, visualización
                fotorrealista por IA y presupuesto exacto sin costos ocultos.
                Para hogares y empresas en Temuco.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="#agenda" className="btn btn-primary btn-lg px-10 shadow-lg shadow-primary/30">
                  Agendar Diagnóstico y Diseño
                </a>
                <a href="#experiencia" className="btn btn-ghost btn-lg">
                  Ver cómo funciona →
                </a>
              </div>
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-8 border-t border-base-content/10">
                {[
                  { num: "+120", label: "Proyectos entregados" },
                  { num: "24h", label: "Render fotorrealista" },
                  { num: "100%", label: "Cumplimiento de plazos" },
                  { num: "0%", label: "Costos ocultos" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="text-3xl font-black text-primary mb-1">{item.num}</div>
                    <div className="text-xs text-neutral-content/80 uppercase tracking-wide">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── DIGITAL EXPERIENCE ──────────────────────────────────────────────── */}
        <section id="experiencia" className="py-12 bg-base-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-6">
              <div className="badge badge-secondary badge-outline mb-4 text-xs tracking-widest uppercase font-semibold">
                Tecnología Pintasso
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">La Experiencia Digital</h2>
              <p className="text-base-content/60 max-w-xl mx-auto leading-relaxed">
                Vea el resultado final antes de que empecemos. Renderizamos su
                espacio con resolución fotorrealista usando inteligencia artificial.
              </p>
            </div>

            {/* Before / After */}
            <div className="relative rounded-3xl overflow-hidden h-72 sm:h-96 mb-16 shadow-2xl border border-base-300">
              <div className="absolute inset-0 right-1/2 flex flex-col justify-end p-8 bg-base-100 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <img src="/before-example.jpg" alt="Antes" className="w-full h-96 object-cover object-center" />
                </div>
                <div className="relative p-4 bg-neutral/50 text-neutral-content">
                  <div className="badge badge-secondary mb-2">ANTES</div>
                  <p className="text-xs">Paredes sin tratar · Espacio genérico</p>
                </div>
              </div>
              <div className="absolute inset-0 left-1/2 flex flex-col justify-end p-8 bg-linear-to-br from-primary/15 via-base-200 to-secondary/10 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <img src="/after-example.jpg" alt="Después" className="w-full h-96 object-cover object-center" />
                </div>
                <div className="relative p-4 bg-neutral/50 text-neutral-content">
                  <div className="badge badge-primary mb-2">DESPUÉS</div>
                  <p className="text-xs">Render fotorrealista · Muro de acento geométrico</p>
                </div>
              </div>
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-primary/60 z-10 flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-accent border-4 border-accent flex items-center justify-center shadow-xl z-20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 3-Step process */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((s) => (
                <div key={s.step} className="card bg-base-100 border border-base-300 hover:border-primary/40 transition-colors duration-200">
                  <div className="card-body gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-5xl font-black text-secondary/15 leading-none">{s.step}</span>
                      <span className="text-secondary">{s.icon}</span>
                    </div>
                    <h3 className="card-title text-lg">{s.title}</h3>
                    <p className="text-sm text-base-content/60 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERVICES ────────────────────────────────────────────────────────── */}
        <section id="servicios" className="py-12 bg-base-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="badge badge-secondary badge-outline mb-4 text-xs tracking-widest uppercase font-semibold">
                Lo que hacemos
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">Nuestros Servicios</h2>
              <p className="text-base-content/60 max-w-xl mx-auto leading-relaxed">
                Cada proyecto es tratado con estándares de ejecución corporativa, sin importar el tamaño.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((svc) => (
                <div key={svc.title} className="card bg-base-200 border border-base-300 hover:shadow-xl hover:shadow-neutral/10 hover:-translate-y-1 transition-all duration-300">
                  <div className="card-body gap-5">
                    <span className="text-4xl text-secondary leading-none">{svc.symbol}</span>
                    <div>
                      <div className="badge badge-outline badge-sm mb-3 text-xs">{svc.tag}</div>
                      <h3 className="card-title text-xl leading-snug">{svc.title}</h3>
                    </div>
                    <p className="text-sm text-base-content/60 leading-relaxed">{svc.desc}</p>
                    <ul className="space-y-2 mt-1">
                      {svc.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-base-content/65">
                          <span className="text-secondary mt-0.5 shrink-0">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="card-actions mt-auto pt-2">
                      <a href="#agenda" className="btn btn-outline btn-secondary btn-sm w-full">
                        Solicitar cotización
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GUARANTEES ──────────────────────────────────────────────────────── */}
        <section id="garantias" className="py-12 bg-base-300">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="badge badge-accent mb-4 text-xs tracking-widest uppercase font-semibold">
                La diferencia Pintasso
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                El rubro tiene fama de informal.
                <br />
                <span className="text-secondary">Nosotros rompemos ese estándar.</span>
              </h2>
              <p className="text-base-content/60 max-w-xl mx-auto leading-relaxed">
                Cada proyecto opera con las mismas garantías de una empresa de construcción certificada.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              {guarantees.map((g) => (
                <div key={g.title} className="card bg-base-100 border border-base-300">
                  <div className="card-body gap-4">
                    <span className="text-3xl text-secondary leading-none">{g.symbol}</span>
                    <h3 className="text-xl font-black">{g.title}</h3>
                    <div className="divider my-0 opacity-20" />
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-widest text-error/60 font-semibold">{g.pain}</p>
                      <p className="text-sm text-base-content/45 italic border-l-2 border-error/25 pl-3">{g.painDesc}</p>
                      <p className="text-xs uppercase tracking-widest text-success/60 font-semibold">La solución Pintasso</p>
                      <p className="text-sm text-base-content/70 leading-relaxed">{g.solutionDesc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="stats stats-vertical sm:stats-horizontal w-full bg-base-100 border border-base-300">
              <div className="stat place-items-center">
                <div className="stat-title text-secondary text-xs">Proyectos completados</div>
                <div className="stat-value text-accent">120+</div>
                <div className="stat-desc">Temuco y Araucanía</div>
              </div>
              <div className="stat place-items-center">
                <div className="stat-title text-secondary text-xs">Tiempo de render</div>
                <div className="stat-value text-accent">24h</div>
                <div className="stat-desc">Desde el levantamiento</div>
              </div>
              <div className="stat place-items-center">
                <div className="stat-title text-secondary text-xs">Proyectos con sobrecosto</div>
                <div className="stat-value text-accent">0%</div>
                <div className="stat-desc">Presupuesto cerrado garantizado</div>
              </div>
              <div className="stat place-items-center">
                <div className="stat-title text-secondary text-xs">Satisfacción del cliente</div>
                <div className="stat-value text-accent">4.9★</div>
                <div className="stat-desc">Promedio verificado</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BOOKING ─────────────────────────────────────────────────────────── */}
        <section id="agenda" className="py-12 bg-base-200">
          <div className="mx-auto px-6">
            <div className="text-center pb-10">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">Agende su Visita Técnica</h2>
              <p className="text-base-content/60 max-w-xl mx-auto leading-relaxed">
                Sin costo. Sin compromiso. Coordinamos la visita, levantamos el
                espacio y le entregamos su render y presupuesto en 24 horas.
              </p>
            </div>

            {confirming ? (
              <div className="flex flex-col items-center justify-center py-20 gap-5">
                <span className="loading loading-spinner loading-lg text-primary" />
                <div className="text-center">
                  <p className="font-semibold mb-1">Reserva confirmada</p>
                  <p className="text-base-content/50 text-sm">Enviando su confirmación por correo…</p>
                </div>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="animate-pulse bg-base-100 rounded-xl w-full h-96 flex items-center justify-center border border-base-300">
                    <span className="text-base-content/40 text-sm">Cargando calendario…</span>
                  </div>
                }
              >
                <Cal
                  namespace="diagnostico"
                  calLink={CALCOM_LINK}
                  config={{ layout: "month_view" }}
                  style={{ width: "100%", height: "700px", overflow: "scroll" }}
                />
              </Suspense>
            )}
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-base-200 py-14 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 text-center">
          <img src="/logo.png" alt="Pintasso" className="w-72 h-30 object-cover" />
          <p className="text-sm text-base-content/45">Pintura de Alta Gama · Temuco, Región de La Araucanía</p>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-base-content/45">
            <a href="#experiencia" className="hover:text-primary transition-colors">Experiencia Digital</a>
            <a href="#servicios" className="hover:text-primary transition-colors">Servicios</a>
            <a href="#garantias" className="hover:text-primary transition-colors">Garantías</a>
            <a href="#agenda" className="hover:text-primary transition-colors">Agenda</a>
          </nav>
          <p className="text-xs text-base-content/25">© 2026 Pintasso. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
