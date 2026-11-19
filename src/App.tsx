import { useCallback, useEffect, useRef, useState } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import './App.css'

const chapters = [
  { name: 'Opening', duration: 6 },
  { name: 'Contributions', duration: 7 },
  { name: 'Consistency', duration: 7 },
  { name: 'Languages', duration: 9 },
  { name: 'Repositories', duration: 7 },
  { name: 'Top project', duration: 8 },
  { name: 'Top five', duration: 10 },
  { name: 'Your identity', duration: 10 },
]
const languages = [['TypeScript',44],['Python',28],['Rust',12],['Go',10],['CSS',6]] as const
const repos = [['orbit-core','618'],['canvas-kit','407'],['signal-api','275'],['atlas-cli','209'],['frame-lab','154']]

function Bands({ variant = '' }: { variant?: string }) {
  return <div className={`bands ${variant}`} aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{'--i':i} as React.CSSProperties}/>)}</div>
}

function Scene({ index, start, download }: { index:number; start:()=>void; download:()=>void }) {
  if(index===0) return <><Bands variant="opening-top"/><div className="opening-copy"><p className="kicker">A YEAR IN CODE</p><h1>YOUR<br/><span>2026.</span><br/>IN CODE.</h1><p>Every contribution left a trace.</p><button className="action" onClick={start}>EXPLORE YOUR YEAR <span>↗</span></button></div><div className="opening-year" aria-hidden="true">26</div><Bands variant="opening-bottom"/></>
  if(index===1) return <><Bands variant="fold-top"/><div className="center-copy"><p className="eyebrow">YOUR YEAR ADDED UP TO</p><h1 className="big-number">1,936</h1><p>contributions.</p><p className="aside">Every little green square counts.</p></div><Bands variant="fold-bottom"/></>
  if(index===2) return <><div className="grid-field" aria-hidden="true">{Array.from({length:80},(_,i)=><i key={i} className={i%7===0||i%11===0?'lit':''}/>)}</div><div className="consistency-copy"><p className="eyebrow">YOU KEPT SHOWING UP</p><h1><span>248</span><br/>DAYS<br/>ACTIVE.</h1><div className="streak"><strong>19</strong><p>DAYS IN A ROW<br/><b>YOUR LONGEST STREAK ↗</b></p></div></div></>
  if(index===3) return <><div className="language-heading"><p className="eyebrow">YOUR LANGUAGE SIGNATURE / 2026</p><h1>WHAT YOU<br/><em>SPOKE.</em></h1><p>Five languages. One way of making things happen.</p></div><div className="language-list">{languages.map(([name,value],i)=><div className="language-row" key={name}><span>0{i+1}</span><strong>{name}</strong><b>{value}%</b><i style={{width:`${value/44*100}%`}}/></div>)}</div><div className="language-orbit" aria-hidden="true">✳</div></>
  if(index===4) return <><Bands variant="aperture-left"/><Bands variant="aperture-right"/><div className="center-copy repo-intro"><p className="eyebrow">A LOT OF IDEAS FOUND A HOME</p><h1><span className="big-number">23</span><br/>REPOSITORIES.</h1><p>Seven were new.<br/>One kept drawing you back.</p></div></>
  if(index===5) return <><div className="reveal-frame"><div className="project-art"><div className="project-grid"/><span>O<span className="project-dot">●</span></span><small>01 / PROJECT</small></div></div><div className="project-copy"><p className="eyebrow">YOUR MOST ACTIVE REPOSITORY</p><h1>ORBIT<br/><em>CORE.</em></h1><p><b>618 contributions.</b> That’s 32% of your year in one place.</p></div><Bands variant="reveal-bottom"/></>
  if(index===6) return <><div className="rank-heading"><p className="eyebrow">YOUR YEAR / BY PROJECT</p><h1>YOUR<br/><em>TOP FIVE.</em></h1></div><div className="rank-list">{repos.map(([name,count],i)=><div className="rank-row" key={name}><span className="rank-number">{i+1}</span><div className={`rank-icon icon-${i}`}>{['◉','▦','↗','⌘','✳'][i]}</div><div><strong>{name}</strong><small>{count} CONTRIBUTIONS</small></div><span className="rank-arrow">↗</span></div>)}</div><Bands variant="rank-bottom"/></>
  return <><div className="identity-lines" aria-hidden="true">{Array.from({length:6},(_,i)=><i key={i}/>)}</div><div className="identity-copy"><p className="eyebrow">YOUR DEVELOPER IDENTITY</p><div className="identity-mark" aria-hidden="true"><span>✳</span><small>BUILD / CONNECT / SHIP</small></div><h1>THE SYSTEMS<br/><em>BUILDER.</em></h1><p>You connect the pieces, strengthen the foundations, and keep shipping.</p><button className="action" onClick={download}>SAVE YOUR YEAR <span>↓</span></button></div></>
}

function downloadPoster(){
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const c=canvas.getContext('2d');if(!c)return
  c.fillStyle='#bdff70';c.fillRect(0,0,1080,1920);c.fillStyle='#111711';c.font='bold 42px sans-serif';c.fillText('GITHUB WRAPPED / 2026',80,130);c.font='bold 205px sans-serif';c.fillText('1,936',70,620);c.font='bold 45px sans-serif';c.fillText('CONTRIBUTIONS  /  23 REPOSITORIES',80,715);c.font='bold 100px sans-serif';c.fillText('THE SYSTEMS',80,1270);c.fillText('BUILDER.',80,1380);c.font='30px sans-serif';c.fillText('2026 · EXAMPLE DATA',80,1810);const link=document.createElement('a');link.download='github-wrapped-2026.png';link.href=canvas.toDataURL('image/png');link.click()
}

const fps = 30
const starts = chapters.map((_, i) => chapters.slice(0, i).reduce((sum, chapter) => sum + chapter.duration * fps, 0))
const totalFrames = chapters.reduce((sum, chapter) => sum + chapter.duration * fps, 0)
const chapterAt = (frame: number) => starts.reduce((current, start, i) => frame >= start ? i : current, 0)
const ratio = 1.168
const scale = (step: number) => Math.pow(ratio, step)
const directions = [1, -1, -1, 1, -1, 1, 1, -1]
const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }

function Story({ reduced, start }: { reduced: boolean; start: () => void }) {
  const frame = useCurrentFrame()
  const index = chapterAt(frame)
  const local = frame - starts[index]
  const duration = chapters[index].duration * fps
  const entrance = reduced ? 1 : interpolate(local, [0, 25], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) })
  const departure = reduced || index === chapters.length - 1 ? 0 : interpolate(local, [duration - 24, duration], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
  const phase = reduced ? 0 : frame / fps
  const direction = directions[index]
  const travel = scale(24)
  const colors = ['#5f63ff', '#57e5a1', '#d28bff', '#ff8ab5', '#3f9dff']
  return <AbsoluteFill className={`experience chapter-${index}`}>
    <div className="motion-field" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => {
        const size = scale(14 + (i % 5))
        const group = i < 5 ? 0 : 1
        return <i key={i} style={{
          background: colors[(index + group) % colors.length],
          left: `${group === 0 ? 3 + (i % 3) * 6 : 78 + (i % 3) * 6}%`,
          top: `${group === 0 ? 12 + i * 4 : 66 + (i - 5) * 5}%`,
          width: size, height: size,
          borderRadius: index % 3 === 1 ? '12%' : '50%',
          transform: `translate(${direction * Math.sin(phase / scale(5) + i / scale(3)) * travel}px, ${Math.cos(phase / scale(7) + i) * scale(16)}px) rotate(${direction * (phase * scale(12) + i * 30)}deg)`,
        }}/>
      })}
    </div>
    <div className="scene motion-scene" style={{ opacity: .82 + entrance * .18, transform: `translateX(${direction * ((1 - entrance) * travel - departure * travel)}px)` }}>
      <Scene index={index} start={start} download={downloadPoster}/>
    </div>
    {!reduced && <div className="transition-ribbon" aria-hidden="true" style={{
      transform: `translate(-50%, -50%) rotate(${direction * 25}deg) scale(${departure * scale(14)})`,
      background: colors[index % colors.length],
    }}/>} 
    {!reduced && <div className="moving-ring" aria-hidden="true" style={{
      transform: `translate(${direction * Math.sin(phase / scale(5)) * scale(23)}px, ${Math.cos(phase / scale(6)) * scale(20)}px) rotate(${direction * phase * scale(18)}deg) scale(${1 + (ratio - 1) * Math.sin(phase)})`,
      borderColor: colors[(index + 1) % colors.length],
    }}/>} 
  </AbsoluteFill>
}

function App(){
  const player = useRef<PlayerRef>(null)
  const [frame, setFrame] = useState(25)
  const [playing, setPlaying] = useState(false)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const index = chapterAt(frame)
  useEffect(() => {
    const current = player.current
    if (!current) return
    const update = (event: { detail: { frame: number } }) => setFrame(event.detail.frame)
    const play = () => setPlaying(true)
    const pause = () => setPlaying(false)
    current.addEventListener('frameupdate', update)
    current.addEventListener('play', play)
    current.addEventListener('pause', pause)
    return () => { current.removeEventListener('frameupdate', update); current.removeEventListener('play', play); current.removeEventListener('pause', pause) }
  }, [])
  const go = useCallback((next: number) => {
    const target = Math.max(0, Math.min(chapters.length - 1, next))
    player.current?.seekTo(starts[target] + (reduced ? 30 : 1))
    if (!reduced) player.current?.play()
  }, [reduced])
  const start = () => go(1)
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(index + 1)
      if (event.key === 'ArrowLeft') go(index - 1)
      if (event.key === ' ' && event.target === document.body) { event.preventDefault(); player.current?.toggle() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [index, go])
  return <main className="player-shell">
    <Player ref={player} component={Story} inputProps={{ reduced, start }} durationInFrames={totalFrames} compositionWidth={390} compositionHeight={844} fps={fps} initialFrame={25} autoPlay={!reduced} clickToPlay={false} style={{ width: '100%', height: '100%' }} />
    <div className="player-ui" style={{ color: [2, 3, 5, 6].includes(index) ? '#10142b' : '#fff' }}>
      <div className="progress" aria-label={`Chapter ${index + 1} of ${chapters.length}`}>{chapters.map((chapter, i) => <button key={chapter.name} aria-label={`Go to ${chapter.name}`} onClick={() => go(i)}><span style={{ transform: `scaleX(${i < index ? 1 : i === index ? (frame - starts[i]) / (chapter.duration * fps) : 0})` }}/></button>)}</div>
      <header><span className="brand"><b>✳</b> GITHUB <strong>WRAPPED</strong> / 26</span><button className="pause" aria-label={playing ? 'Pause story' : 'Play story'} onClick={() => player.current?.toggle()}>{playing ? 'Ⅱ' : '▶'}</button></header>
      <div className="tap-zones"><button aria-label="Previous chapter" disabled={index === 0} onClick={() => go(index - 1)}/><button aria-label="Next chapter" disabled={index === chapters.length - 1} onClick={() => go(index + 1)}/></div>
      <footer><span>2026 · EXAMPLE DATA</span><span>{String(index + 1).padStart(2, '0')} / 08</span></footer>
      {index === 7 && <button className="replay" onClick={() => go(0)}>REPLAY ↺</button>}
    </div>
  </main>
}
export default App
