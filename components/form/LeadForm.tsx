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
  type ValorCredito,
  type TrackingParams,
  type CreateLeadResponse,
  type QualificationAnswers,
} from "@/types/lead";

import { useAbandonedLead } from "@/lib/use-abandoned-lead";

const TOTAL_STEPS = 5;

export function LeadForm() {
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);

  function goToStep(next: number) {
    setStep(next);
  }

  const [valorCredito, setValorCredito] = useState<ValorCredito>();
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

  const [savingMotivo, setSavingMotivo] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [schedError, setSchedError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<{ date: string; time: string } | null>(null);
  const [savingOutro, setSavingOutro] = useState(false);

  useEffect(() => {
    const saved = loadPersistedState();
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(saved.step);
      setValorCredito(saved.valorCredito);
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

  useEffect(() => {
    if (!hydrated) return;
    savePersistedState({
      step,
      valorCredito,
      motivo,
      nome,
      telefone,
      instagram,
      consentimento,
      dealId,
      contactId,
      scheduled,
    });
  }, [hydrated, step, valorCredito, motivo, nome, telefone, instagram, consentimento, dealId, contactId, scheduled]);

  const answers: QualificationAnswers | null = useMemo(() => {
    if (!valorCredito) return null;
    return { valorCredito, motivo, nome, telefone, instagram: instagram || undefined };
  }, [valorCredito, motivo, nome, telefone, instagram]);

  const notifyPayload = useMemo(() => {
    if (!answers || !dealId || !contactId) return null;
    return { ...answers, dealId, contactId, agendado: false as const, tracking };
  }, [answers, dealId, contactId, tracking]);

  const { markScheduled } = useExitNotify(notifyPayload, step === 3 && !!notifyPayload);

  // Gatilho invisível para leads que param no Motivo e desistem.
  const abandonedPayload = useMemo(() => {
    if (!answers) return null;
    return { ...answers, tracking, eventId: leadEventId };
  }, [answers, tracking, leadEventId]);

  const { disarmAbandonedLead } = useAbandonedLead(abandonedPayload, step === 2 && !dealId);

  const submittingLeadRef = useRef(false);

  async function submitContato() {
    if (!answers) return;
    goToStep(2);
  }

  async function submitMotivo() {
    if (!answers || submittingLeadRef.current) return;
    submittingLeadRef.current = true;
    setSavingMotivo(true);
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
      disarmAbandonedLead();
      goToStep(3);
    } catch {
      // Se falhar o envio ao CRM aqui, mostra erro ao usuário (pode ser problema na API)
      setLeadError("Não foi possível enviar seus dados agora. Tente novamente.");
      submittingLeadRef.current = false;
    } finally {
      setSavingMotivo(false);
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
      goToStep(4);
    } catch {
      setSchedError("Não foi possível confirmar o agendamento agora. Tente novamente.");
    } finally {
      setConfirming(false);
    }
  }

  // "Nenhum desses horários funciona pra mim" — nunca cria agendamento
  // automático (os slots são fixos, texto livre não bate na grade). Só
  // anota a preferência na descrição do negócio já existente (best-effort,
  // ver /api/deal-note) e manda a mesma informação pro consultor via
  // WhatsApp — mesmo se a anotação no CRM falhar, o consultor ainda fica
  // sabendo.
  async function handleOutroHorario(texto: string) {
    markScheduled();
    setSavingOutro(true);
    try {
      const notaLimpa = texto.trim();
      if (dealId && notaLimpa) {
        fetch("/api/deal-note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId, note: `Horário preferido (informado pelo lead): ${notaLimpa}` }),
        }).catch(() => {});
      }
      if (dealId && contactId && answers) {
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...answers,
            dealId,
            contactId,
            agendado: false,
            preferenciaHorario: notaLimpa || undefined,
            tracking,
          }),
        }).catch(() => {});
      }
      setScheduled(null);
      goToStep(4);
    } finally {
      setSavingOutro(false);
    }
  }

  // Sem gate de "espera hidratar" aqui de propósito: a grande maioria de
  // quem abre a landing nunca esteve aqui antes, então mostrar a etapa 1
  // imediatamente (inclusive no HTML estático, antes do JS carregar) é o
  // que importa pra velocidade percebida. Os poucos casos com progresso
  // salvo (ver efeito acima) trocam de etapa um instante depois do
  // primeiro paint — troca instantânea (sem animação, ver StepTransition),
  // então não tem nada "quebrando" visualmente nessa troca.
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
        <ContatoStep
          step={1}
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
          onBack={() => goToStep(0)}
          loading={loadingLead}
          error={leadError}
        />
      );
      break;
    case 2:
      content = (
        <MotivoStep 
          step={2} 
          total={TOTAL_STEPS} 
          value={motivo} 
          onChange={setMotivo} 
          onNext={submitMotivo} 
          loading={savingMotivo}
        />
      );
      break;
    case 3:
      content = (
        <AgendamentoStep
          step={3}
          total={TOTAL_STEPS}
          onConfirm={confirmAgendamento}
          onOutroHorario={handleOutroHorario}
          confirming={confirming}
          savingOutro={savingOutro}
          error={schedError}
        />
      );
      break;
    default:
      content = <ConfirmacaoStep scheduled={scheduled} />;
  }

  return <StepTransition step={step}>{content}</StepTransition>;
}
