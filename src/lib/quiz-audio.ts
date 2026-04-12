export type QuizSound = 'correct' | 'incorrect'

let quizAudioContext: AudioContext | null = null

function getQuizAudioContext() {
  if (typeof window === 'undefined') return null

  const AudioContextClass =
    window.AudioContext ??
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext

  if (!AudioContextClass) return null

  if (!quizAudioContext) {
    quizAudioContext = new AudioContextClass()
  }

  return quizAudioContext
}

type ToneStep = {
  duration: number
  frequency: number
  offset: number
}

function playToneSequence(
  audioContext: AudioContext,
  steps: ToneStep[],
  peakGain: number,
  oscillatorType: OscillatorType = 'sine'
) {
  const now = audioContext.currentTime
  const masterGain = audioContext.createGain()

  masterGain.gain.setValueAtTime(0.0001, now)
  masterGain.gain.exponentialRampToValueAtTime(peakGain, now + 0.01)

  const endTime = steps.reduce(
    (latest, step) => Math.max(latest, step.offset + step.duration),
    0
  )

  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + endTime + 0.06)
  masterGain.connect(audioContext.destination)

  steps.forEach(({ frequency, offset, duration }) => {
    const oscillator = audioContext.createOscillator()
    const noteGain = audioContext.createGain()
    const startAt = now + offset

    oscillator.type = oscillatorType
    oscillator.frequency.setValueAtTime(frequency, startAt)

    noteGain.gain.setValueAtTime(0.0001, startAt)
    noteGain.gain.exponentialRampToValueAtTime(0.28, startAt + 0.01)
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

    oscillator.connect(noteGain)
    noteGain.connect(masterGain)

    oscillator.start(startAt)
    oscillator.stop(startAt + duration + 0.02)
  })
}

function playIncorrectBuzzer(audioContext: AudioContext) {
  const now = audioContext.currentTime
  const masterGain = audioContext.createGain()

  masterGain.gain.setValueAtTime(0.0001, now)
  masterGain.gain.exponentialRampToValueAtTime(0.18, now + 0.01)
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38)
  masterGain.connect(audioContext.destination)

  ;[
    { start: 380, end: 200 },
    { start: 190, end: 110 },
  ].forEach(({ start, end }) => {
    const oscillator = audioContext.createOscillator()
    const noteGain = audioContext.createGain()

    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(start, now)
    oscillator.frequency.exponentialRampToValueAtTime(end, now + 0.3)

    noteGain.gain.setValueAtTime(0.0001, now)
    noteGain.gain.exponentialRampToValueAtTime(0.18, now + 0.01)
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)

    oscillator.connect(noteGain)
    noteGain.connect(masterGain)

    oscillator.start(now)
    oscillator.stop(now + 0.32)
  })
}

export function playQuizSound(kind: QuizSound) {
  const audioContext = getQuizAudioContext()
  if (!audioContext) return

  const play = () => {
    if (kind === 'correct') {
      playToneSequence(
        audioContext,
        [
          { frequency: 659.25, offset: 0, duration: 0.12 },
          { frequency: 783.99, offset: 0.08, duration: 0.12 },
          { frequency: 987.77, offset: 0.16, duration: 0.18 },
        ],
        0.18,
        'triangle'
      )
      return
    }

    playIncorrectBuzzer(audioContext)
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume().then(play).catch(() => undefined)
    return
  }

  play()
}
