      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    // Normalizaciones (para consistencia)
    data.email = normalizeEmail(data.email);
    data.phone = normalizePhone(data.phone!);
    data.name = data.name.trim();
    data.company = data.company?.trim();
    data.role = data.role?.trim();

    const cc = countryToCode(data.country);
    const pipeline_id = PIPELINES[cc];
    const stage_id = STAGE_CAPA1[cc];

    const personId = await upsertPersonWithPhoneAndRole(data);

    // Organización (obligatoria por tu regla en frontend, pero igual lo manejamos)
    let orgId: number | undefined;
    if (data.company) {
      try {
        const s = await pd(
          `/organizations/search?term=${encodeURIComponent(data.company)}&exact_match=true`
        );
        const it = (s as any)?.data?.items?.[0];
        orgId = it?.item?.id;
      } catch {}
      if (!orgId) {
        try {
          const o = await pd(`/organizations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: data.company }),
          });
          orgId = (o as any)?.data?.id;
        } catch (e) {
          console.error("[organizations POST]", (e as Error).message);
        }
      }
    }

    // Deal
    console.log(
      `[Deals] Creando deal → cc=${cc} pipeline=${pipeline_id} stage=${stage_id}`
    );
    const deal = await pd(`/deals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Diagnóstico – ${data.name}`,
        person_id: personId!,
        org_id: orgId,
        pipeline_id,
        stage_id,
        value: 0,
        currency: "GTQ",
      }),
    });
    const dealId = (deal as any)?.data?.id;
    console.log(`🟢 Deal #${dealId} creado en pipeline ${pipeline_id}, stage ${stage_id}`);

    // Nota con contexto
    try {
      const answersBrief = briefAnswersSummary(data.answers);

      const content =
        `Formulario diagnóstico\n` +
        `• Nombre: ${data.name}\n` +
        (data.company ? `• Empresa: ${data.company}\n` : "") +
        (data.role ? `• Cargo: ${data.role}\n` : "") +
        `• Email: ${data.email}\n` +
        (data.country ? `• País: ${data.country}\n` : "") +
        (data.phone ? `• Teléfono: ${data.phone}\n` : "") +
        (answersBrief ? `\nResumen:\n${answersBrief}\n` : "") +
        (data.answers
          ? `\nRespuestas (JSON):\n${JSON.stringify(data.answers, null, 2)}`
          : "");

      await pd(`/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          deal_id: dealId,
          person_id: personId!,
          org_id: orgId,
        }),
      });
    } catch (e) {
      console.error("[notes POST]", (e as Error).message);
    }

    // Email (no bloqueante)
    try {
      await sendEmailConfirmation(data, req);
    } catch (e) {
      console.error("[email]", (e as Error).message);
    }

    return NextResponse.json({
      ok: true,
      message: "Deal creado, persona actualizada, nota agregada y correo enviado",
    });
  } catch (e: any) {
    console.error("[/api/submit] Error:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: e?.message || "No se logró enviar" },
      { status: 500 }
    );
  }
}
