"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ActivityPlayerProps, ActivityStep, StepFeedback } from "../Model";
import { activitySteps, levelBand, normalizeAnswer, readGrammarMistake, saveCompletion, saveGrammarMistake } from "@/features/Activities/Controller";
import { postCompletion } from "@/services/activities";

export function useActivityPlayer({ activity, profile, date, vocabularyCards }: ActivityPlayerProps) {
  const [previousMistake, setPreviousMistake] = useState<number | null>(null);
  const steps = useMemo(() => activitySteps(activity, profile.level, vocabularyCards, previousMistake), [activity, profile.level, vocabularyCards, previousMistake]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [selected, setSelected] = useState("");
  const [ordered, setOrdered] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<StepFeedback | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [finished, setFinished] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [canRecord, setCanRecord] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [responses, setResponses] = useState<string[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioUrl = useRef("");
  const step = steps[index];
  const band = levelBand(profile.level);
  const prompt = step?.promptByBand?.[band] ?? step?.prompt ?? "";
  const levelGuide = band === "basic" ? "Responda com palavras ou frases curtas." : band === "intermediate" ? "Inclua uma razão ou detalhe na resposta." : "Use uma resposta completa, precisa e com justificativa.";
  const readyToAnswer = activity.id !== 10 || index !== 0 || secondsLeft === 0;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCanSpeak("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
      setCanRecord("MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia);
      if (activity.id === 29) setPreviousMistake(readGrammarMistake(profile.userId));
    }, 0);
    return () => { window.clearTimeout(timer); if (recorder.current?.state === "recording") recorder.current.stop(); stream.current?.getTracks().forEach((track) => track.stop()); if (audioUrl.current) URL.revokeObjectURL(audioUrl.current); };
  }, [activity.id, profile.userId]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value === null ? null : value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  function speak(rate = 0.85) {
    if (!canSpeak || !step?.speechText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(step.speechText);
    utterance.lang = "en-US";
    utterance.rate = rate;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase() === "en-us");
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function evaluate(value: string, current: ActivityStep = step) {
    const valid = [current.answer, ...(current.accepted ?? [])].filter((item): item is string => !!item);
    const correct = valid.some((item) => normalizeAnswer(item) === normalizeAnswer(value));
    setAttempts((count) => count + 1);
    if (correct) {
      setSolved(true);
      setFeedback({ correct: true, message: current.explanation ?? "Muito bem!" });
    } else {
      saveGrammarMistake(profile.userId, activity.id);
      setFeedback({ correct: false, message: attempts === 0 ? "Ainda não. Tente novamente; uma pista está disponível." : `Resposta sugerida: ${current.answer ?? ""}. ${current.explanation ?? ""}` });
      if (attempts >= 1) setSolved(true);
    }
  }

  function choose(option: string) { if (solved) return; setSelected(option); evaluate(option); }
  function submitText() {
    if (!answer.trim() || solved) return;
    evaluate(answer);
  }
  function addToken(tokenIndex: number) { if (!solved && !ordered.includes(tokenIndex)) setOrdered((current) => [...current, tokenIndex]); }
  function resetOrder() { if (!solved) setOrdered([]); }
  function submitOrder() {
    if (!step?.tokens || ordered.length !== step.tokens.length || solved) return;
    evaluate(ordered.map((position) => step.tokens![position]).join(" "));
  }
  function submitOpen() {
    if (!answer.trim()) { setFeedback({ correct: false, message: "Escreva sua resposta antes de ver o exemplo." }); return; }
    if (activity.id === 17) {
      const secret = step.context?.match(/Palavra secreta: ([^.]*)/)?.[1] ?? "umbrella";
      if (answer.toLowerCase().includes(secret.toLowerCase())) { setFeedback({ correct: false, message: `Explique sem dizer ${secret}.` }); return; }
      const blocked = step.blockedWords?.find((word) => normalizeAnswer(answer).split(" ").includes(normalizeAnswer(word)));
      if (band !== "basic" && blocked) { setFeedback({ correct: false, message: `Neste nível, explique também sem usar ${blocked}.` }); return; }
    }
    const words = answer.trim().split(/\s+/);
    if (words.length > 30 && activity.id === 27) { setFeedback({ correct: false, message: "O resumo deve ter no máximo 30 palavras." }); return; }
    setSolved(true);
    setFeedback({ correct: true, message: step.deferModel ? "Revise os pontos abaixo e melhore a mensagem na próxima etapa." : "Compare sua resposta com o exemplo e os critérios. A escrita livre não recebe correção automática." });
  }
  function revealRecord() {
    if (!readyToAnswer) { setFeedback({ correct: false, message: "Inicie e conclua os 15 segundos de preparação antes de responder." }); return; }
    if (!recordingUrl && !answer.trim()) { setFeedback({ correct: false, message: "Grave sua voz ou escreva uma resposta antes de comparar." }); return; }
    setSolved(true);
    setFeedback({ correct: true, message: "Ouça sua gravação e a referência. Escolha um trecho para melhorar na próxima tentativa." });
  }

  async function startRecording() {
    if (!canRecord || recording || !readyToAnswer) return;
    try {
      const capture = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = capture;
      const next = new MediaRecorder(capture);
      const chunks: Blob[] = [];
      next.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      next.onstop = () => {
        capture.getTracks().forEach((track) => track.stop());
        if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
        audioUrl.current = URL.createObjectURL(new Blob(chunks, { type: next.mimeType || "audio/webm" }));
        setRecordingUrl(audioUrl.current);
        setRecording(false);
      };
      next.start(); recorder.current = next; setRecording(true); setFeedback(null);
    } catch { setFeedback({ correct: false, message: "Não foi possível acessar o microfone. Você pode escrever sua resposta." }); }
  }
  function stopRecording() { if (recorder.current?.state === "recording") recorder.current.stop(); }

  function next() {
    if (!solved && step.kind !== "route") return;
    const response = step.kind === "order" ? ordered.map((position) => step.tokens?.[position] ?? "").join(" ") : selected || answer || (recordingUrl ? "Gravação local" : "");
    setResponses((current) => [...current, response]);
    if (index === steps.length - 1) {
      saveCompletion(profile.userId, date, activity.slug);
      void postCompletion(activity.slug).catch(() => {});
      setFinished(true);
      return;
    }
    if (audioUrl.current) { URL.revokeObjectURL(audioUrl.current); audioUrl.current = ""; }
    setIndex((current) => current + 1); setAnswer(""); setSelected(""); setOrdered([]);
    setFeedback(null); setAttempts(0); setSolved(false); setRecordingUrl(""); setSecondsLeft(null);
  }

  return { step, stepsCount: steps.length, index, prompt, band, levelGuide, readyToAnswer, answer, setAnswer, selected, ordered, feedback, attempts, solved, finished, canSpeak, canRecord, recording, recordingUrl, secondsLeft, responses, speak, choose, submitText, addToken, resetOrder, submitOrder, submitOpen, revealRecord, startRecording, stopRecording, next, startTimer: () => setSecondsLeft(15) };
}
