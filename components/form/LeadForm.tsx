"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StepTransition } from "./StepTransition";
import { ChoiceStep } from "./steps/ChoiceStep";
import { MotivoStep } from "./steps/MotivoStep";
import { ContatoStep } from "./steps/ContatoStep";
import { AgendamentoStep } from "./steps/AgendamentoStep";
import { ConfirmacaoStep } from "./steps/ConfirmacaoStep";
import { captureTrackingParams } from "@/lib/tracking";
import { useExitNotify } from "@/lib/use-exit-notify";
import { trackPixelEvent, newEventId } from "@/lib/meta-pixel-client";
import { loadPersistedState, savePersistedState } from "@/lib/form-persistence";
import {
  VALOR_CREDITO_OPTIONS,
  FAIXA_PARCELA_OPTIONS,
  PRAZO_OPTIONS,
  type ValorCredito,
  type FaixaParcela,
  type Prazo,
  type TrackingParams,
  type CreateLeadResponse,
  type QualificationAnswers,
} from "@/types/lead";

const TOTAL_STEPS = 7;

export function LeadForm() {
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);
  // 1 = avançando (desliza da direita), -1 = voltando (desliza da
  // esquerda) — StepTransition usa isso pra saber de que lado animar.
  const [direction, setDirection] = useState(1);

  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  const [valorCredito, setValorCredito] = useState<ValorCredito>();
  const [faixaParcela, setFaixaParcela] = useState<FaixaParcela>();
  const [prazo, setPrazo] = useState<Prazo>();
  const [motivo, setMotivo] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [consentimento, setConsentimento] = useState(false);

  const [tracking, setTracking] = useState<TrackingParams>({});
  const [leadEventId] = useState(newEventId);
  const [scheduleEventId] = useState(newEventId);

  const [dealId, setDealId] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [schedError, setSchedError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<{ date: string; time: string } | null>(null);

  // Retoma um preenchimento interrompido (reload sem querer, aba fechada
  // por engano) logo depois do primeiro paint — a etapa 1 já apareceu
  // (ver comentário perto do `switch` mais abaixo), então isso só troca
  // de etapa quando existe progresso salvo de verdade.
  useEffect(() => {
    // Lê localStorage + URL/cookies (sistemas externos ao React) uma vez,
    // no mount — não dá pra calcular isso durante o render porque este
    // componente também é renderizado no servidor, onde eles não existem.
    const saved = loadPersistedState();
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(saved.step);
      setValorCredito(saved.valorCredito);
      setFaixaParcela(saved.faixaParcela);
      setPrazo(saved.prazo);
      setMotivo(saved.motivo);
      setNome(saved.nome);
      setTelefone(saved.telefone);
      setInstagram(saved.instagram);
      setConsentimento(saved.consentimento);
      setDealId(saved.dealId);
      setContactId(saved.contactId);
      setScheduled(saved.scheduled);
    }
    setTracking(captureTrackingParams());
    setHydrated(true);
  }, []);

  // Salva a cada mudança relevante — barato (poucos KB, escrita síncrona)
  // e garante que um reload no meio de qualquer etapa recupera exatamente
  // de onde parou, inclusive se já tiver `dealId` (não recria o negócio
  // no CRM ao retomar, só continua pro agendamento).
  useEffect(() => {
    if (!hydrated) return;
    savePersistedState({
      step,
      valorCredito,
      faixaParcela,
      prazo,
      motivo,
      nome,
      telefone,
      instagram,
      consentimento,
      dealId,
      contactId,
      scheduled,
    });
  }, [hydrated, step, valorCredito, faixaParcela, prazo, motivo, nome, telefone, instagram, consentimento, dealId, contactId, scheduled]);

  const answers: QualificationAnswers | null = useMemo(() => {
    if (!valorCredito || !faixaParcela || !prazo) return null;
    return { valorCredito, faixaParcela, prazo, motivo, nome, telefone, instagram: instagram || undefined };
  }, [valorCredito, faixaParcela, prazo, motivo, nome, telefone, instagram]);

  const notifyPayload = useMemo(() => {
    if (!answers || !dealId || !contactId) return null;
    return { ...answers, dealId, contactId, agendado: false as const, tracking };
  }, [answers, dealId, contactId, tracking]);

  const { markScheduled } = useExitNotify(notifyPayload, step === 5 && !!notifyPayload);

  // Trava síncrona, separada do `loadingLead` (estado) — um duplo toque
  // rápido no botão dispara os dois cliques antes do React terminar de
  // re-renderizar com `disabled`, então dava pra mandar dois POST /api/lead
  // com o mesmo telefone quase juntos. Isso é justamente o que faz o CRM
  // esbarrar numa condição de corrida dele (cria o mesmo contato duas vezes
  // em paralelo) e devolver "Conflito ao criar contato". A ref é checada e
  // setada antes de qualquer `await`, então bloqueia o segundo clique de
  // verdade, sem depender do ciclo de render.
  const submittingLeadRef = useRef(false);

  async function submitContato() {
    if (!answers || submittingLeadRef.current) return;
    submittingLeadRef.current = true;
    setLoadingLead(true);
    setLeadError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, tracking, eventId: leadEventId }),
      });
      if (!res.ok) throw new Error();
      const data: CreateLeadResponse = await res.json();
      setDealId(data.dealId);
      setContactId(data.contactId);
      trackPixelEvent("Lead", leadEventId);
      goToStep(5);
    } catch {
      setLeadError("Não foi possível enviar seus dados agora. Tente novamente.");
      // Só destrava em caso de falha — em caso de sucesso a etapa muda e
      // este formulário nunca chama submitContato() de novo mesmo assim,
      // mas destravar também não faz mal nenhum.
      submittingLeadRef.current = false;
    } finally {
      setLoadingLead(false);
    }
  }

  async function confirmAgendamento(date: string, time: string) {
    if (!dealId || !contactId) return;
    setConfirming(true);
    setSchedError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, dealId, date, time, tracking, eventId: scheduleEventId }),
      });
      if (res.status === 409) {
        setSchedError("slot_unavailable");
        return;
      }
      if (!res.ok) throw new Error();

      trackPixelEvent("Schedule", scheduleEventId);
      markScheduled();
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, dealId, contactId, agendado: true, data: date, hora: time, tracking }),
      }).catch(() => {});

      setScheduled({ date, time });
      goToStep(6);
    } catch {
      setSchedError("Não foi possível confirmar o agendamento agora. Tente novamente.");
    } finally {
      setConfirming(false);
    }
  }

  function skipAgendamento() {
    markScheduled();
    if (dealId && contactId && answers) {
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, dealId, contactId, agendado: false, tracking }),
      }).catch(() => {});
    }
    setScheduled(null);
    goToStep(6);
  }

  // Sem gate de "espera hidratar" aqui de propósito: a grande maioria de
  // quem abre a landing nunca esteve aqui antes, então mostrar a etapa 1
  // imediatamente (inclusive no HTML estático, antes do JS carregar) é o
  // que importa pra velocidade percebida. Os poucos casos com progresso
  // salvo (ver efeito acima) trocam de etapa um instante depois do
  // primeiro paint — a própria transição entre etapas (StepTransition) já
  // deixa essa troca suave, em vez de aparecer quebrada.
  let content;
  switch (step) {
    case 0:
      content = (
        <ChoiceStep
          step={0}
          total={TOTAL_STEPS}
          title="Qual valor de crédito você busca hoje?"
          options={VALOR_CREDITO_OPTIONS}
          value={valorCredito}
          onChange={setValorCredito}
          onNext={() => goToStep(1)}
        />
      );
      break;
    case 1:
      content = (
        <ChoiceStep
          step={1}
          total={TOTAL_STEPS}
          title="Qual faixa de parcela você considera ideal?"
          options={FAIXA_PARCELA_OPTIONS}
          value={faixaParcela}
          onChange={setFaixaParcela}
          onNext={() => goToStep(2)}
          onBack={() => goToStep(0)}
        />
      );
      break;
    case 2:
      content = (
        <ChoiceStep
          step={2}
          total={TOTAL_STEPS}
          title="Para quando você pretende contratar o consórcio?"
          options={PRAZO_OPTIONS}
          value={prazo}
          onChange={setPrazo}
          onNext={() => goToStep(3)}
          onBack={() => goToStep(1)}
        />
      );
      break;
    case 3:
      content = (
        <MotivoStep step={3} total={TOTAL_STEPS} value={motivo} onChange={setMotivo} onNext={() => goToStep(4)} onBack={() => goToStep(2)} />
      );
      break;
    case 4:
      content = (
        <ContatoStep
          step={4}
          total={TOTAL_STEPS}
          nome={nome}
          telefone={telefone}
          instagram={instagram}
          consentimento={consentimento}
          onChangeNome={setNome}
          onChangeTelefone={setTelefone}
          onChangeInstagram={setInstagram}
          onChangeConsentimento={setConsentimento}
          onNext={submitContato}
          onBack={() => goToStep(3)}
          loading={loadingLead}
          error={leadError}
        />
      );
      break;
    case 5:
      content = (
        <AgendamentoStep
          step={5}
          total={TOTAL_STEPS}
          onConfirm={confirmAgendamento}
          onSkip={skipAgendamento}
          confirming={confirming}
          error={schedError}
        />
      );
      break;
    default:
      content = <ConfirmacaoStep scheduled={scheduled} />;
  }

  return (
    <StepTransition step={step} direction={direction}>
      {content}
    </StepTransition>
  );
}
