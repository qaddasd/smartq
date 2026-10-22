import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export function ProjectNav() {
  const { copy } = useStore();
  return (
    <nav className="project-nav" aria-label={copy("Разделы проекта", "Жоба бөлімдері")}>
      <Link to="/project" activeProps={{ className: "selected" }}>
        {copy("О проекте", "Жоба туралы")}
      </Link>
      <Link to="/economics" activeProps={{ className: "selected" }}>
        {copy("Экономический эффект", "Экономикалық әсер")}
      </Link>
      <Link to="/analytics" activeProps={{ className: "selected" }}>
        {copy("Показатели центров", "Орталық көрсеткіштері")}
      </Link>
      <Link to="/methodology" activeProps={{ className: "selected" }}>
        {copy("Научное обоснование", "Ғылыми негіздеме")}
      </Link>
    </nav>
  );
}
