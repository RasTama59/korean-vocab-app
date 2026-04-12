import styles from './favorite-button.module.css'

type FavoriteButtonProps = {
  active: boolean
  onClick: () => void
}

export function FavoriteButton({ active, onClick }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.button} ${active ? styles.active : ''}`}
      aria-pressed={active}
      title={active ? 'お気に入りから外す' : 'お気に入りに追加する'}
    >
      {active ? '★ お気に入り' : '☆ お気に入り'}
    </button>
  )
}
