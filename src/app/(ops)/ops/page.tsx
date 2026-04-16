const panels = [
  {
    title: 'Tenants',
    description: 'Organization health, ownership, and support state.',
  },
  {
    title: 'Billing',
    description: 'Stripe sync, grace periods, and payment failures.',
  },
  {
    title: 'Jobs',
    description: 'Queue health, retries, and long-running maintenance work.',
  },
  {
    title: 'Recovery',
    description: 'Audit trails, restore paths, and incident controls.',
  },
]

export default function OpsPage() {
  return (
    <section>
      <p>Studio99 Ops</p>
      <h1>Platform operations workspace</h1>
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          marginTop: '24px',
        }}
      >
        {panels.map((panel) => (
          <article
            key={panel.title}
            style={{ border: '1px solid #d4d4d8', borderRadius: '8px', padding: '16px' }}
          >
            <h2 style={{ margin: '0 0 8px' }}>{panel.title}</h2>
            <p style={{ margin: 0 }}>{panel.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
