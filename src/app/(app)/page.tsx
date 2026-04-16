export default function HomePage() {
  return (
    <section>
      <p>Studio99 Application Core</p>
      <h1>表向きは /console、実働は /app、裏口は /admin の構成です。</h1>
      <p>
        まず <code>/bootstrap/owner</code> で最初の管理者を作り、次に <code>/console</code> で
        管理画面へ入ってください。プロダクト本体は <code>/app</code>、生の管理は
        <code>/admin</code>、内部運用は <code>/ops</code> です。
      </p>
    </section>
  )
}
