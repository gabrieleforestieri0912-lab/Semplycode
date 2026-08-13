export default function ChromeLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l9.953 6.851 3.556-5.571C14.898 2.635 13.562 0 12 0zm7.12 4.562c-2.873-2.628-7.086-2.607-9.93 0l-9.189 15.505C1.565 21.496 3.715 24 6.702 24h10.596c2.985 0 5.136-2.502 4.701-5.935L19.12 4.562zM12 9.6c-1.326 0-2.4 1.074-2.4 2.4s1.074 2.4 2.4 2.4 2.4-1.074 2.4-2.4-1.074-2.4-2.4-2.4z" />
    </svg>
  );
}
