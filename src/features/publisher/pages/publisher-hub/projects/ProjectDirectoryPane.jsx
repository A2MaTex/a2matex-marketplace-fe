import { useMemo } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import styles from "./ProjectDirectoryPane.module.css";

const formatRelativeTime = (value) => {
  if (!value) return "Never updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  const elapsedSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const ranges = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let valueInUnit = elapsedSeconds;
  for (const [range, unit] of ranges) {
    if (Math.abs(valueInUnit) < range) {
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        Math.round(valueInUnit),
        unit,
      );
    }
    valueInUnit /= range;
  }
  return date.toLocaleDateString();
};

const ProjectDirectoryPane = ({
  projects,
  page,
  totalItems,
  totalPages,
  loading,
  error,
  search,
  status,
  selectedProjectId,
  onSearchChange,
  onStatusChange,
  onProjectSelect,
  onPageChange,
  onRetry,
}) => {
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      [project.name, project.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [projects, search]);

  const safeTotalPages = Math.max(1, totalPages);

  return (
    <aside className={styles.directory} aria-label="Project directory">
      <header className={styles.header}>
        <div className={styles.headingRow}>
          <div>
            <p className={styles.eyebrow}>Project directory</p>
            <h1>Projects & Drafts</h1>
          </div>
          <span className={styles.countBadge}>Total: {totalItems}</span>
        </div>

        <div className={styles.searchWrap}>
          <FiSearch aria-hidden="true" size={14} />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search this page..."
            aria-label="Search projects on the current page"
          />
        </div>

        <div className={styles.filters}>
          <label>
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              aria-label="Filter projects by status"
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
        </div>
      </header>

      {loading && <div className={styles.loadingBar} aria-label="Loading projects" />}

      <div className={styles.listArea}>
        {error ? (
          <div className={styles.state} role="alert">
            <strong>Projects unavailable</strong>
            <p>{error.message}</p>
            <button type="button" onClick={onRetry}>
              <FiRefreshCw aria-hidden="true" /> Retry
            </button>
          </div>
        ) : null}

        {!error && !loading && projects.length === 0 ? (
          <div className={styles.state}>
            <strong>No projects in this view</strong>
            <p>Try another status filter or create a project in A2MaTeX Studio.</p>
          </div>
        ) : null}

        {!error && projects.length > 0 && filteredProjects.length === 0 ? (
          <div className={styles.state}>
            <strong>No match on this page</strong>
            <p>Search only filters the {projects.length} projects currently loaded.</p>
          </div>
        ) : null}

        {!error && filteredProjects.length > 0 ? (
          <ul className={styles.list} aria-label="Publisher projects">
            {filteredProjects.map((project) => {
              const selected = project.id === selectedProjectId;
              return (
                <li key={project.id} className={styles.projectItem}>
                  <button
                    type="button"
                    className={`${styles.projectButton} ${selected ? styles.projectButtonSelected : ""}`}
                    onClick={() => onProjectSelect(project.id)}
                    aria-current={selected ? "page" : undefined}
                  >
                    <span className={styles.projectTopline}>
                      <span className={styles.projectName}>{project.name}</span>
                      <span
                        className={`${styles.statusBadge} ${
                          project.status === "ACTIVE" ? styles.statusActive : styles.statusArchived
                        }`}
                      >
                        {project.status}
                      </span>
                    </span>
                    <span className={styles.projectDescription}>
                      {project.description || "No project description"}
                    </span>
                    <span className={styles.projectMeta}>
                      Updated {formatRelativeTime(project.updatedAt ?? project.createdAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <footer className={styles.pagination}>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={loading || page <= 1}
          aria-label="Previous project page"
        >
          <FiChevronLeft aria-hidden="true" />
        </button>
        <span>
          Page <strong>{page}</strong> / {safeTotalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={loading || totalPages === 0 || page >= totalPages}
          aria-label="Next project page"
        >
          <FiChevronRight aria-hidden="true" />
        </button>
      </footer>
    </aside>
  );
};

export default ProjectDirectoryPane;
