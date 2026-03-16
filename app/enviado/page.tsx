import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formulario enviado | Grupo Inforum",
  description: "Gracias por contactarnos. Hemos recibido tu información.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EnviadoPage() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-3">¡Listo!</h1>
      <p className="text-gray-700 mb-6">
        Hemos recibido tu formulario de contacto. Una persona de nuestro equipo se pondrá en
        contacto en menos de 24hrs.
      </p>

      <a
        href="https://grupoinforum.com"
        className="inline-flex items-center justify-center rounded-[10px] px-5 py-3 font-semibold text-white"
        style={{ backgroundColor: "#082a49" }}
      >
        Visita nuestro website
      </a>
    </div>
  );
}
