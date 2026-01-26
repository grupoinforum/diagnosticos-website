// app/diagnostico/diagnostico-content.tsx
"use client";

import React, { useMemo, useState } from "react";

type CountryCode = "GT" | "SV" | "HN" | "PA" | "RD" | "EC";

type AnswerItem = {
  id: "industria" | "interes" | "mensaje";
  value: string | string[];
  extraText?: string;
};

type SubmitPayload = {
  name: string;
  company?: string;
  role?: string;
  email: string;
  country?: string;
  phone?: string;
  answers?: {
    utms?: Record<string, string>;
    items: AnswerItem[];
  };
};

type Option = { label: string; value: string };

const INDUSTRIA_OPTIONS: Option[] = [
  { label: "Producción", value: "Producción" },
  { label: "Distribución", value: "Distribución" },
  { label: "Retail", value: "Retail" },
  { label: "Servicios", value: "Servicios" },
  { label: "Inmobiliaria/ Desarrollo", value: "Inmobiliaria/ Desarrollo" },
  { label: "Otro", value: "Otro" },
];

const INTERES_OPTIONS: Option[] = [
  { label: "SAP Business One", value: "SAP Business One" },
  {
    label: "Diagnóstico 360 de su sistema SAP Business One",
    value: "Diagnóstico 360 de su sistema SAP Business One",
  },
  { label: "IaaS / Servicio de DRP", value: "IaaS / Servicio de DRP" },
  { label: "Software de Nómina", value: "Software de Nómina" },
  {
    label: "Software de Gestión de Productos",
    value: "Software de Gestión de Productos",
  },
  {
    label: "Integración Bancaria con SAP Business One",
    value: "Integración Bancaria con SAP Business One",
  },
  { label: "Otro", value: "Otro" },
];

const COUNTRY_PREFIX: Record<CountryCode, string> = {
  GT: "+502",
  SV: "+503",
  HN: "+504",
  PA: "+507",
  RD: "+1 809",
  EC: "+593",
};

function getUTMs(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "msclkid",
  ];
  const utms: Record<string, string> = {};
  keys.forEach((k) => {
    const v = params.get(k);
    if (v) utms[k] = v;
  });
  return utms;
}

function isNonEmpty(s?: string) {
  return typeof s === "string" && s.trim().length > 0;
}

export default function DiagnosticoContent() {
  // ===== Paso (2 pantallas) =====
  const [step, setStep] = useState<1 | 2>(1);

  // ===== Paso 1: preguntas =====
  const [industria, setIndustria] = useState<string[]>([]);
  const [industriaOtro, setIndustriaOtro] = useState<string>("");

  const [interes, setInteres] = useState<string>("");
  const [interesOtro, setInteresOtro] = useState<string>("");

  const [mensaje, setMensaje] = useState<string>("");

  // ===== Paso 2: datos =====
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<CountryCode>("GT");
  const [phone, setPhone] = useState(COUNTRY_PREFIX.GT);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>("");

  // Auto-prefijo al cambiar país (si el usuario no ha editado manualmente demasiado)
  const countryPrefix = useMemo(() => COUNTRY_PREFIX[country], [country]);
  React.useEffect(() => {
    const allPrefixes = Object.values(COUNTRY_PREFIX);
    const normalized = phone.trim();
    if (!normalized || allPrefixes.includes(normalized)) {
      setPhone(countryPrefix);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryPrefix]);

  // Limpia texto "Otro" si ya no aplica
  React.useEffect(() => {
    if (!industria.includes("Otro") && industriaOtro) setIndustriaOtro("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industria]);
  React.useEffect(() => {
    if (interes !== "Otro" && interesOtro) setInteresOtro("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interes]);

  // ===== Validaciones =====
  const step1Valid = useMemo(() => {
    // 1 obligatoria (al menos una seleccionada)
    if (!industria.length) return false;
    // Si industria incluye Otro -> obligatorio texto
    if (industria.includes("Otro") && !isNonEmpty(industriaOtro)) return false;

    // 2 obligatoria
    if (!isNonEmpty(interes)) return false;
    // Si interes = Otro -> obligatorio texto
    if (interes === "Otro" && !isNonEmpty(interesOtro)) return false;

    // 3 opcional (mensaje)
    return true;
  }, [industria, industriaOtro, interes, interesOtro]);

  const step2Valid = useMemo(() => {
    if (!isNonEmpty(name)) return false;
    if (!isNonEmpty(email)) return false;
    return true;
  }, [name, email]);

  function goNext() {
    setError("");
    if (!step1Valid) {
      setError("Por favor completa las preguntas obligatorias.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setError("");
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitAll() {
    setError("");
    if (!step1Valid) {
      setError("Por favor completa las preguntas obligatorias.");
      setStep(1);
      return;
    }
    if (!step2Valid) {
      setError("Por favor completa tu nombre y correo.");
      return;
    }

    const items: AnswerItem[] = [
      {
        id: "industria",
        value: industria,
        ...(industria.includes("Otro") ? { extraText: industriaOtro.trim() } : {}),
      },
      {
        id: "interes",
        value: interes,
        ...(interes === "Otro" ? { extraText: interesOtro.trim() } : {}),
      },
      {
        id: "mensaje",
        value: mensaje.trim(),
      },
    ];

    const payload: SubmitPayload = {
      name: name.trim(),
      company: company.trim() || undefined,
      role: role.trim() || undefined,
      email: email.trim(),
      country,
      phone: phone.trim() || undefined,
      answers: { utms: getUTMs(), items },
    };

    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out?.ok) {
        throw new Error(out?.error || "No se logró enviar. Intenta nuevamente.");
      }

      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setError(e?.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  // ===== UI helpers =====
  const Progress = ({ current }: { current: 1 | 2 }) => {
    const is1 = current === 1;
    const is2 = current === 2;
    return (
      <div className="w-full mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                is1 ? "bg-[#0B4A6F] text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              1
            </div>
            <div className={`text-sm ${is1 ? "font-semibold" : "text-gray-600"}`}>
              Información
            </div>
          </div>
          <div className="flex-1 h-[2px] bg-gray-200 rounded" />
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                is2 ? "bg-[#0B4A6F] text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              2
            </div>
            <div className={`text-sm ${is2 ? "font-semibold" : "text-gray-600"}`}>
              Datos
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (done) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-3">¡Listo!</h1>
        <p className="text-gray-700 mb-6">
          Hemos recibido tu formulario de contacto. Una persona de nuestro equipo se pondrá en
          contacto en menos de 24hrs.
        </p>

        <a
          href="https://www.grupoinforum.com"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center justify-center rounded-[10px] px-5 py-3 font-semibold text-white"
          style={{ backgroundColor: "#082a49" }}
        >
          Visita nuestro website
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10">
      <Progress current={step} />

      {error ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-7">
          <h1 className="text-2xl font-semibold">Solicitud de Información</h1>

          {/* Pregunta 1 */}
          <div className="rounded-xl border border-gray-200 p-5">
            <p className="font-semibold mb-3">
              1. ¿En qué industria opera la compañía? <span className="text-red-600">*</span>
            </p>

            <div className="space-y-2">
              {INDUSTRIA_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={industria.includes(opt.value)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIndustria((prev) =>
                        checked ? [...prev, opt.value] : prev.filter((v) => v !== opt.value)
                      );
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {industria.includes("Otro") ? (
              <div className="mt-4">
                <label className="block text-sm font-semibold mb-2">
                  Otro: Especificar <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={industriaOtro}
                  onChange={(e) => setIndustriaOtro(e.target.value)}
                  placeholder="Escribe la industria"
                />
              </div>
            ) : null}
          </div>

          {/* Pregunta 2 */}
          <div className="rounded-xl border border-gray-200 p-5">
            <p className="font-semibold mb-3">
              2. ¿En qué producto o servicio está interesado?{" "}
              <span className="text-red-600">*</span>
            </p>

            <div className="space-y-2">
              {INTERES_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="interes"
                    value={opt.value}
                    checked={interes === opt.value}
                    onChange={(e) => setInteres(e.target.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {interes === "Otro" ? (
              <div className="mt-4">
                <label className="block text-sm font-semibold mb-2">
                  Otro: Especificar <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={interesOtro}
                  onChange={(e) => setInteresOtro(e.target.value)}
                  placeholder="Escribe tu interés"
                />
              </div>
            ) : null}
          </div>

          {/* Pregunta 3 */}
          <div className="rounded-xl border border-gray-200 p-5">
            <p className="font-semibold mb-2">
              3. Mensaje <span className="text-gray-500 font-normal">(opcional)</span>
            </p>
            <textarea
              className="w-full min-h-[110px] rounded-lg border border-gray-300 px-3 py-2"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Cuéntanos más detalles (si deseas)"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={goNext}
              className="rounded-[10px] px-6 py-3 font-semibold text-white"
              style={{ backgroundColor: "#0B4A6F" }}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Tus datos</h2>

          <div className="rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Nombre <span className="text-red-600">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Empresa</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Nombre de empresa"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Cargo</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Tu cargo"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Correo <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">País</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={country}
                  onChange={(e) => setCountry(e.target.value as CountryCode)}
                >
                  <option value="GT">Guatemala</option>
                  <option value="SV">El Salvador</option>
                  <option value="HN">Honduras</option>
                  <option value="PA">Panamá</option>
                  <option value="RD">Rep. Dominicana</option>
                  <option value="EC">Ecuador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Teléfono</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={countryPrefix}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="rounded-[10px] px-6 py-3 font-semibold border border-gray-300"
            >
              Regresar
            </button>

            <button
              type="button"
              onClick={submitAll}
              disabled={loading}
              className="rounded-[10px] px-6 py-3 font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "#0B4A6F" }}
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
