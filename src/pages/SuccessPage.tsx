import { useSearchParams } from "react-router-dom";

const nextSteps = [
  "Nuestro equipo se presentará puntualmente en el horario que eligió.",
  "Realizaremos el levantamiento digital y la captura fotográfica del espacio.",
  "En menos de 24 horas recibirá su render fotorrealista y presupuesto cerrado.",
];

export default function SuccessPage() {
  const [params] = useSearchParams();

  const order = params.get("order") ?? "—";
  const name = params.get("name") ?? null;
  const email = params.get("email") ?? null;

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col">

      {/* Navbar */}
      <header className="navbar bg-base-100/90 backdrop-blur-lg border-b border-base-200 px-4 lg:px-8">
        <div className="navbar-start">
          <a href="/" className="text-2xl font-black tracking-widest text-primary">
            PINTASSO
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full text-center">

          {/* Success icon */}
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-8 rounded-full bg-success/10 border-2 border-success/25">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black mb-3">¡Visita Confirmada!</h1>
          <p className="text-base-content/60 max-w-sm mx-auto leading-relaxed mb-10">
            {name ? `Hola ${name}, su` : "Su"} visita técnica ha sido agendada.
            {email && (
              <>
                {" "}
                Se envió un correo de confirmación a{" "}
                <span className="font-semibold text-base-content/80">{email}</span>.
              </>
            )}
          </p>

          {/* Order number card */}
          <div className="card bg-base-200 border border-base-300 mb-10">
            <div className="card-body py-8 text-center gap-2">
              <p className="text-xs uppercase tracking-widest font-semibold text-base-content/40">
                Número de Orden / Código de Reserva
              </p>
              <p className="text-2xl font-black text-accent tracking-widest break-all">{order}</p>
              <div className="flex justify-center mt-1">
                <div className="badge badge-outline badge-sm">Guarde este código como referencia</div>
              </div>
            </div>
          </div>

          {/* Confirmation email alert */}
          <div role="alert" className="alert alert-success mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">
              Correo de confirmación enviado vía Gmail. Revise su bandeja de entrada.
            </span>
          </div>

          {/* Next steps */}
          <div className="text-left bg-base-200 rounded-2xl p-6 mb-8 border border-base-300">
            <h2 className="font-bold mb-4 text-sm uppercase tracking-wider text-base-content/50">
              ¿Qué sigue?
            </h2>
            <ul className="space-y-4">
              {nextSteps.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-base-content/70 leading-relaxed">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-success/15 flex items-center justify-center text-success font-black text-xs mt-0.5">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <a href="/" className="btn btn-primary btn-lg w-full shadow-lg shadow-primary/25">
            Volver al inicio
          </a>
        </div>
      </main>
    </div>
  );
}
