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
      goToStep(2);
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

  async function submitMotivo() {
    if (!dealId || !motivo.trim()) {
      goToStep(3);
      return;
    }
    setSavingMotivo(true);
    try {
      await fetch("/api/deal-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, note: `Motivo informado: ${motivo.trim()}` }),
      });
      goToStep(3);
    } catch {
      // Falha silenciosa pro usuário, continua pro agendamento.
      goToStep(3);
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
