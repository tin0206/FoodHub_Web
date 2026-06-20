export default function LoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
    >
      <div
        className="rounded-xl p-7 shadow-lg"
        style={{ backgroundColor: 'var(--tm-surface)' }}
      >
        <div
          className="w-9 h-9 rounded-full border-4 animate-spin"
          style={{ borderColor: 'var(--tm-border)', borderTopColor: '#059669' }}
        />
      </div>
    </div>
  )
}
