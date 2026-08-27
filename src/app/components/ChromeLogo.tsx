import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChrome } from "@fortawesome/free-brands-svg-icons";

export default function ChromeLogo({ className }: { className?: string }) {
  return (
    <FontAwesomeIcon icon={faChrome} className={className} aria-hidden="true" />
  );
}
