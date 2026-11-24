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
