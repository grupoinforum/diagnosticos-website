"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  {
    label: "Fibbo portal para proveedores",
    value: "Fibbo portal para proveedores",
  },
  {
    label: "IPSO - Intelligent Process & Strategy Optimization",
    value: "IPSO - Intelligent Process & Strategy Optimization",
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

function normalizeEmail(s: string) {
  return s.trim().toLowerCase();
}

function isValidEmailFormat(email: string) {
  const e = normalizeEmail(email);
  if (e.length > 254) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(e);
}

const BLOCKED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.es",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

function isCorporateEmail(email: string) {
  const e = normalizeEmail(email);
  if (!isValidEmailFormat(e)) return false;
  const domain = e.split("@")[1] || "";
  if (!domain) return false;
  if (BLOCKED_EMAIL_DOMAINS.has(domain)) return false;
  if (domain.endsWith(".local")) return false;
  return true;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function isValidPhone(phone: string) {
  const p = normalizePhone(phone);
  const digits = p.replace(/\D/g, "");
  if (!p.startsWith("+")) return false;
  if (digits.length < 8 || digits.length > 15) return false;
  return true;
}

type FieldErrors = Partial<Record<"name" | "company" | "role" | "email" | "phone", string>>;

export default function DiagnosticoContent() {
  const router = useRouter();
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

  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const nameRef = useRef<HTMLInputElement | null>(null);
  const companyRef = useRef<HTMLInputElement | null>(null);
  const roleRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  const countryPrefix = useMemo(() => COUNTRY_PREFIX[country], [country]);
  React.useEffect(() => {
    const allPrefixes = Object.values(COUNTRY_PREFIX);
    const normalized = phone.trim();
    if (!normalized || allPrefixes.includes(normalized)) {
      setPhone(countryPrefix);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryPrefix]);

  React.useEffect(() => {
    if (!industria.includes("Otro") && industriaOtro) setIndustriaOtro("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industria]);

  React.useEffect(() => {
    if (interes !== "Otro" && interesOtro) setInteresOtro("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interes]);

  const step1Valid = useMemo(() => {
    if (!industria.length) return false;
    if (industria.includes("Otro") && !isNonEmpty(industriaOtro)) return false;

    if (!isNonEmpty(interes)) return false;
    if (interes === "Otro" && !isNonEmpty(interesOtro)) return false;

    return true;
  }, [industria, industriaOtro, interes, interesOtro]);

  function validateStep2(): {
    ok: boolean;
    errors: FieldErrors;
    firstRef?: React.RefObject<HTMLInputElement>;
  } {
    const errors: FieldErrors = {};

    const nm = name.trim();
    const em = email.trim();
    const ph = phone.trim();

    if (!isNonEmpty(nm)) errors.name = "Este campo es obligatorio.";

    const cp = company.trim();
    if (!isNonEmpty(cp)) errors.company = "Este campo es obligatorio.";

    const rl = role.trim();
    if (!isNonEmpty(rl)) errors.role = "Este campo es obligatorio.";

    if (!isNonEmpty(em)) {
      errors.email = "Este campo es obligatorio.";
    } else if (!isValidEmailFormat(em)) {
      errors.email = "Ingresa un correo válido (ej. nombre@empresa.com).";
    } else if (!isCorporateEmail(em)) {
      errors.email = "Debe ser un correo corporativo (no Gmail/Hotmail/Outlook, etc.).";
    }

    if (!isNonEmpty(ph)) {
      errors.phone = "Este campo es obligatorio.";
    } else if (!isValidPhone(ph)) {
      errors.phone = "Teléfono inválido. Usa formato internacional, ej. +502 5555 5555.";
    }

    let first: React.RefObject<HTMLInputElement> | undefined;
    if (errors.name) first = { current: nameRef.current } as any;
    else if (errors.company) first = { current: companyRef.current } as any;
    else if (errors.role) first = { current: roleRef.current } as any;
    else if (errors.email) first = { current: emailRef.current } as any;
    else if (errors.phone) first = { current: phoneRef.current } as any;

    return { ok: Object.keys(errors).length === 0, errors, firstRef: first };
  }

  function scrollToRef(
    ref:
      | React.RefObject<HTMLInputElement>
      | { current: HTMLInputElement | null }
      | undefined
  ) {
    const el = ref?.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => el.focus(), 200);
  }

  function goNext() {
    setError("");
    if (!step1Valid) {
      setError("Por favor completa las preguntas obligatorias.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStep(2);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setError("");
    setFieldErrors({});
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitAll() {
    setError("");
    setFieldErrors({});

    if (!step1Valid) {
      setError("Por favor completa las preguntas obligatorias.");
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const v2 = validateStep2();
    if (!v2.ok) {
      setError("Revisa los campos marcados en rojo.");
      setFieldErrors(v2.errors);
      scrollToRef(v2.firstRef as any);
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

      router.push("/enviado");
    } catch (e: any) {
      setError(e?.message || "Ocurrió un error.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-offset-1";
  const inputOk = "border-gray-300 focus:ring-[#0B4A6F]/40";
  const inputBad = "border-red-500 focus:ring-red-300";
  const errText = "mt-1 text-sm text-red-600";

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

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10">
      {error ? (
        <div className="sticky top-2 z-50 mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      ) : null}

      <Progress current={step} />

      {step === 1 ? (
        <div className="space-y-7">
          <h1 className="text-2xl font-semibold">Solicitud de Información</h1>

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
                ref={nameRef}
                className={`${inputBase} ${fieldErrors.name ? inputBad : inputOk}`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                }}
                placeholder="Tu nombre"
                aria-invalid={!!fieldErrors.name}
              />
              {fieldErrors.name ? <div className={errText}>{fieldErrors.name}</div> : null}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Empresa <span className="text-red-600">*</span>
              </label>
              <input
                ref={companyRef}
                className={`${inputBase} ${fieldErrors.company ? inputBad : inputOk}`}
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  if (fieldErrors.company) setFieldErrors((p) => ({ ...p, company: undefined }));
                }}
                placeholder="Nombre de empresa"
                aria-invalid={!!fieldErrors.company}
              />
              {fieldErrors.company ? <div className={errText}>{fieldErrors.company}</div> : null}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Cargo <span className="text-red-600">*</span>
              </label>
              <input
                ref={roleRef}
                className={`${inputBase} ${fieldErrors.role ? inputBad : inputOk}`}
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  if (fieldErrors.role) setFieldErrors((p) => ({ ...p, role: undefined }));
                }}
                placeholder="Tu cargo"
                aria-invalid={!!fieldErrors.role}
              />
              {fieldErrors.role ? <div className={errText}>{fieldErrors.role}</div> : null}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Correo corporativo <span className="text-red-600">*</span>
              </label>
              <input
                ref={emailRef}
                type="email"
                className={`${inputBase} ${fieldErrors.email ? inputBad : inputOk}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="nombre@empresa.com"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email ? <div className={errText}>{fieldErrors.email}</div> : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  País <span className="text-red-600">*</span>
                </label>
                <select
                  className={`${inputBase} ${inputOk}`}
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
                <label className="block text-sm font-semibold mb-2">
                  Teléfono <span className="text-red-600">*</span>
                </label>
                <input
                  ref={phoneRef}
                  className={`${inputBase} ${fieldErrors.phone ? inputBad : inputOk}`}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  placeholder={countryPrefix}
                  aria-invalid={!!fieldErrors.phone}
                />
                {fieldErrors.phone ? <div className={errText}>{fieldErrors.phone}</div> : null}
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
