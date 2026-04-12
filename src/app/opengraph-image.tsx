import { ImageResponse } from 'next/og'

export const alt = 'Korean Lean'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background:
            'linear-gradient(135deg, rgb(248, 243, 235) 0%, rgb(231, 239, 247) 48%, rgb(255, 220, 206) 100%)',
          color: 'rgb(20, 27, 52)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '72px',
              height: '72px',
              borderRadius: '22px',
              background: 'rgb(20, 27, 52)',
              color: 'white',
              fontSize: '28px',
              fontWeight: 700,
            }}
          >
            KL
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '26px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.78,
              }}
            >
              Korean Lean
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: '64px',
                fontWeight: 800,
                lineHeight: 1.08,
                gap: '6px',
              }}
            >
              <span>Korean Vocabulary</span>
              <span>Quiz and Study</span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxWidth: '760px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: '30px',
                lineHeight: 1.4,
                gap: '6px',
              }}
            >
              <span>例文クイズ・単語クイズ・一覧・タイピングで</span>
              <span>韓国語の語彙を続けやすく学べるサイト</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minWidth: '240px',
            }}
          >
            {['Example Quiz', 'Word Quiz', 'Typing'].map((label) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 20px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.78)',
                  border: '1px solid rgba(20, 27, 52, 0.12)',
                  fontSize: '22px',
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  )
}
