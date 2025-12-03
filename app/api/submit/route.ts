// app/diagnostico/diagnostico-content.tsx
"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

/* =========================
   PREGUNTAS – SIN PUNTUACIÓN
   ========================= */
const QUESTIONS = [
  {
    id: "industria",
    label: "¿En qué industria opera la compañía?",
    type: "single" as const,
    options: [
      { value: "produccion", label: "Producción" },
      { value: "distribucion", label: "Distribución" },
      { value: "retail", label: "Retail" },
      { value: "servicios", label: "Servicios" },
      { value: "inmobiliaria_desarrollo", label: "Inmobiliaria y Desarrollo" },
      { value: "restaurante", label: "Restaurante" },
      { value: "otro", label: "Otro (especificar)", requiresText: true },
    ],
    required: true,
  },
  {
    id: "erp",
    label: "¿Qué sistema empresarial (ERP) utiliza actualmente su empresa?",
    type: "single" as const,
    options: [
      { value: "sapb1", label: "SAP Business One" },
      { value: "sistema_propio", label: "Sistema Propio" },
      { value: "erp_otro", label: "Otro (especificar)", requiresText: true },
    ],
    required: true,
  },
  {
    id: "busca",
    label: "¿Estás buscando un sistema o un servicio en particular?",
    type: "single" as const,
    options: [
      { value: "sistema", label: "Sistema (especificar)", requiresText: true },
      { value: "servicio", label: "Servicio (especificar)", requiresText: true },
    ],
    required: true,
  },
] as const;

type Answer = { id: string; value: string; extraText?: string };

/* =========================
   PAÍSES / PREFIJOS / REGLAS
   ========================= */
const COUNTRIES = [
  { value: "GT", label: "Guatemala" },
  { value: "SV", label: "El Salvador" },
  { value: "HN", label: "Honduras" },
  { value: "PA", label: "Panamá" },
  { value: "DO", label: "República Dominicana" },
  { value: "EC", label: "Ecuador" },
] as const;

type CountryValue = (typeof COUNTRIES)[number]["value"];

const COUNTRY_PREFIX: Record<CountryValue, string> = {
  GT: "+502",
  SV: "+503",
  HN: "+504",
  PA: "+507",
  DO: "+1",
  EC: "+593",
};

const COUNTRY_PHONE_RULES: Record<
  CountryValue,
  { min: number; max?: number; note?: string }
> = {
  GT: { min: 8 },
  SV: { min: 8 },
  HN: { min: 8 },
  PA: { min: 8 },
  DO: { min: 10 },
  EC: { min: 9, note: "Usa tu número móvil (9 dígitos)" },
};

const DEFAULT_PREFIX = "+502";

/* =========================
   EMAIL corporativo simple
   ========================= */
const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "aol.com",
  "live.com",
  "msn.com",
];

function isCorporateEmail(email: string) {
  const domain = email.split("@").pop()?.toLowerCase().trim();
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.includes(domain);
}

/* =========================
   API HELPER
   ========================= */
async function submitDiagnostico(payload: any) {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false)
    throw new Error(json?.error || `Error ${res.status}`);
  return json;
}

/* =========================
   COMPONENTE
   ========================= */
export default function DiagnosticoContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, Answer | undefined>>({});
  const [form, setForm] = useState<{
    name: string;
    company: string;
    role: string;
    email: string;
    country: CountryValue;
    consent: boolean;
    phoneLocal: string; // parte local SIN prefijo
  }>({
    name: "",
    company: "",
    role: "",
    email: "",
    country: "GT",
    consent: false,
    phoneLocal: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultUI, setResultUI] = useState<null | { title: string; message: string }>(
    null
  );

  const utms = useMemo(() => {
    const keys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ] as const;
    const x: Record<string, string> = {};
    keys.forEach((k) => {
      const v = searchParams.get(k);
      if (v) x[k] = v;
    });
    return x;
  }, [searchParams]);

  const progressPct = useMemo(() => (step / 3) * 100, [step]);
  const barWidth = progressPct + "%";

  const handleSelect = (qid: string, optionValue: string) => {
    const q = QUESTIONS.find((q) => q.id === qid)!;
    const opt = q.options.find((o) => o.value === optionValue)!;
    setAnswers((prev) => ({
      ...prev,
      [qid]: { id: qid, value: optionValue },
    }));
  };

  const handleExtraText = (qid: string, text: string) => {
    const existing = answers[qid];
    if (!existing) return;
    setAnswers((prev) => ({
      ...prev,
      [qid]: { ...existing, extraText: text },
    }));
  };

  const shouldShowExtraInput = (qid: string) => {
    const q = QUESTIONS.find((qq) => qq.id === qid);
    if (!q) return false;
    const selected = answers[qid]?.value;
    const selectedOpt = q.options.find((o) => o.value === selected) as any;
    return !!selectedOpt?.requiresText;
  };

  const canContinueQuestions = useMemo(
    () => QUESTIONS.every((q) => !!answers[q.id]),
    [answers]
  );

  /* =========================
     TELÉFONO con prefijo y reglas
     ========================= */
  const selectedPrefix = useMemo(
    () => COUNTRY_PREFIX[form.country] ?? DEFAULT_PREFIX,
    [form.country]
  );

  const phoneFull = useMemo(() => {
    const local = (form.phoneLocal || "").replace(/[^\d]/g, "");
    return `${selectedPrefix}${local ? " " + local : ""}`;
  }, [form.phoneLocal, selectedPrefix]);

  const isPhoneValid = (local: string, country: CountryValue) => {
    const digits = (local || "").replace(/[^\d]/g, "");
    const rule = COUNTRY_PHONE_RULES[country];
    if (!rule) return digits.length >= 8; // fallback
    const meetsMin = digits.length >= rule.min;
    const meetsMax = rule.max ? digits.length <= rule.max : true;
    return meetsMin && meetsMax;
  };

  const phoneRequirementText = (() => {
    const rule = COUNTRY_PHONE_RULES[form.country];
    if (!rule) return "Ingresa al menos 8 dígitos del número local.";
    const minTxt = `${rule.min} dígitos`;
    const maxTxt = rule.max ? ` (máx. ${rule.max})` : "";
    const note = rule.note ? ` · ${rule.note}` : "";
    return `Ingresa ${minTxt}${maxTxt} del número local${note}.`;
  })();

  const canContinueData = useMemo(
    () =>
      form.name.trim().length > 1 &&
      form.company.trim().length > 1 &&
      form.role.trim().length > 1 &&
      /.+@.+\..+/.test(form.email) &&
      isCorporateEmail(form.email) &&
      isPhoneValid(form.phoneLocal, form.country),
    [form]
  );

  const onSubmit = async () => {
    setErrorMsg(null);
    if (!form.consent) {
      setErrorMsg("Debes aceptar el consentimiento para continuar.");
      return;
    }
    setLoading(true);

    try {
      const finalAnswers = Object.values(answers).filter(Boolean) as Answer[];
      const countryLabel =
        COUNTRIES.find((c) => c.value === form.country)?.label || form.country;

      await submitDiagnostico({
        name: form.name,
        company: form.company,
        role: form.role,
        email: form.email,
        country: countryLabel,
        phone: phoneFull,
        answers: { utms, items: finalAnswers },
      });

      setResultUI({
        title: "Formulario enviado",
        message:
          "Gracias por compartirnos esta información. Nuestro equipo revisará tus respuestas y te contactará para acompañarte en los siguientes pasos.",
      });
    } catch (e: any) {
      setErrorMsg(e?.message || "No se logró enviar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RESULTADO
     ========================= */
  if (resultUI) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <div className="w-full h-2 bg-gray-200 rounded mb-6">
          <div className="h-2 bg-blue-500 rounded" style={{ width: "100%" }} />
        </div>

        <h1 className="text-2xl font-semibold mb-3">{resultUI.title}</h1>
        <p className="whitespace-pre-line text-gray-800 leading-relaxed">
          {resultUI.message}
        </p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:gap-4">
          <a
            href="https://www.grupoinforum.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-5 py-3 rounded-2xl bg-[#082a49] text-white text-center"
          >
            Visita nuestro website
          </a>

          <a
            href="https://wa.me/50242170962?text=Hola%2C%20vengo%20del%20formulario%20de%20software%20de%20gesti%C3%B3n"
            className="inline-block px-5 py-3 rounded-2xl bg-blue-600 text-white text-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ir a WhatsApp
          </a>
        </div>
      </main>
    );
  }

  /* =========================
     FORMULARIO
     ========================= */
  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* Barra de progreso */}
      <div className="w-full h-2 bg-gray-200 rounded mb-6">
        <div
          className="h-2 bg-blue-500 rounded transition-all"
          style={{ width: barWidth }}
        />
      </div>

      {/* Título y descripción */}
      <h1 className="text-2xl font-semibold mb-4">
        Análisis de Software de Gestión Empresarial
      </h1>
      <p className="text-gray-600 mb-4">
        Completa el cuestionario para que podamos analizar tu situación actual y
        entender qué soluciones se ajustan mejor a las necesidades de tu
        empresa.
      </p>

      {errorMsg && <p className="text-sm text-red-600 mb-4">{errorMsg}</p>}

      {/* Paso 1 */}
      {step === 1 && (
        <section className="space-y-6">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="p-4 rounded-2xl border border-gray-200">
              <label className="font-medium block mb-3">{q.label}</label>
              <div className="space-y-2">
                {q.options.map((o) => (
                  <div key={o.value} className="flex items-center gap-3">
                    <input
                      type="radio"
                      id={`${q.id}_${o.value}`}
                      name={q.id}
                      className="cursor-pointer"
                      onChange={() => handleSelect(q.id, o.value)}
                      checked={answers[q.id]?.value === o.value}
                    />
                    <label
                      htmlFor={`${q.id}_${o.value}`}
                      className="cursor-pointer"
                    >
                      {o.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Campo libre solo si la opción seleccionada lo requiere */}
              {shouldShowExtraInput(q.id) && (
                <input
                  type="text"
                  placeholder="Especifica aquí"
                  className="mt-3 w-full border rounded-xl px-3 py-2"
                  onChange={(e) => handleExtraText(q.id, e.target.value)}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canContinueQuestions}
              className="px-5 py-3 rounded-2xl shadow bg-blue-600 text-white disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {/* Paso 2 */}
      {step === 2 && (
        <section className="space-y-4">
          <div>
            <label className="block mb-1">Nombre</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1">Empresa</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>

          {/* Cargo en la empresa (obligatorio) */}
          <div>
            <label className="block mb-1">Cargo en la empresa</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Ej.: Gerente de TI"
            />
          </div>

          <div>
            <label className="block mb-1">Correo empresarial</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {form.email && !isCorporateEmail(form.email) && (
              <p className="text-sm text-red-600 mt-1">
                Usa un correo corporativo (no gmail/hotmail/outlook/yahoo, etc.).
              </p>
            )}
          </div>

          {/* País */}
          <div>
            <label className="block mb-1">País</label>
            <select
              className="w-full border rounded-xl px-3 py-2"
              value={form.country}
              onChange={(e) =>
                setForm({
                  ...form,
                  country: e.target.value as CountryValue,
                })
              }
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Teléfono con prefijo automático */}
          <div>
            <label className="block mb-1">Teléfono</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l border border-r-0 bg-gray-50 px-3 text-sm">
                {selectedPrefix}
              </span>
              <input
                className="w-full rounded-r border px-3 py-2"
                value={form.phoneLocal}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phoneLocal: e.target.value.replace(/[^\d]/g, ""),
                  })
                }
                placeholder="Ingresa tu número (solo dígitos)"
                inputMode="numeric"
                pattern="\d*"
              />
            </div>

            {!isPhoneValid(form.phoneLocal, form.country) &&
            form.phoneLocal.length > 0 ? (
              <p className="text-xs text-red-600 mt-1">{phoneRequirementText}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Se enviará como: <strong>{phoneFull || selectedPrefix}</strong>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3 rounded-2xl border"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canContinueData}
              className="px-5 py-3 rounded-2xl shadow bg-blue-600 text-white disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {/* Paso 3 */}
      {step === 3 && (
        <section className="space-y-4">
          <div className="p-4 rounded-2xl border border-gray-200">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) =>
                  setForm({ ...form, consent: e.target.checked })
                }
              />
              <span>
                Autorizo a Grupo Inforum a contactarme respecto a esta
                evaluación y servicios relacionados. He leído la{" "}
                {process.env.NEXT_PUBLIC_PRIVACY_URL ? (
                  <a
                    href={process.env.NEXT_PUBLIC_PRIVACY_URL}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Política de Privacidad
                  </a>
                ) : (
                  <span className="font-medium">Política de Privacidad</span>
                )}
              </span>
            </label>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-3 rounded-2xl border"
            >
              Atrás
            </button>
            <button
              onClick={onSubmit}
              disabled={loading || !form.consent}
              className="px-5 py-3 rounded-2xl shadow bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar formulario"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
