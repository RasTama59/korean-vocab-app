type SpeakKoreanOptions = {
  rate?: number
}

function pickKoreanVoice(voices: SpeechSynthesisVoice[]) {
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith('ko-kr')) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('ko')) ??
    null
  )
}

export function speakKorean(text: string, options: SpeakKoreanOptions = {}) {
  if (typeof window === 'undefined' || !text.trim()) return

  const synth = window.speechSynthesis
  const utterance = new SpeechSynthesisUtterance(text)
  const voice = pickKoreanVoice(synth.getVoices())

  synth.cancel()

  utterance.lang = 'ko-KR'
  utterance.rate = options.rate ?? 0.95

  if (voice) {
    utterance.voice = voice
  }

  synth.speak(utterance)
}

export function stopSpeaking() {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
}
