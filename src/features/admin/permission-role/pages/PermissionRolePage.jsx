import { useState, useEffect, useMemo } from "react";
import {
  MdShield,
  MdAdd,
  MdSave,
  MdSearch,
  MdSelectAll,
  MdEdit,
  MdContentCopy,
  MdDelete,
  MdCheckCircle,
  MdError,
  MdFilterList,
  MdCode,
  MdClose,
} from "react-icons/md";
import { HiOutlineShieldCheck } from "react-icons/hi";
import { BsCheckCircleFill } from "react-icons/bs";
import styles from "./PermissionRolePage.module.css";
import { permissionRoleApi } from "../api/permissionRoleApi";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../auth/store/authStore";

const HTTP_METHODS = ["ALL", "GET", "POST", "PUT", "DELETE", "PATCH"];
const ITEMS_PER_PAGE = 10;

function getModules(permissions) {
  const mods = [...new Set(permissions.map((p) => p.module))];
  return ["All Modules", ...mods];
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PermissionRolePage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [draftIds, setDraftIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [roleSearch, setRoleSearch] = useState("");
  const [permFilter, setPermFilter] = useState("");
  const [activeModule, setActiveModule] = useState("All Modules");
  const [activeMethod, setActiveMethod] = useState("ALL");
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [rolesData, permsData] = await Promise.all([
        permissionRoleApi.getAllRoles(),
        permissionRoleApi.getAllPermissions(),
      ]);

      setRoles(rolesData);
      setPermissions(permsData);

      if (rolesData.length > 0) {
        setSelectedRoleId(rolesData[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async () => {
    setPage(1);
    setPermFilter("");
    setActiveModule("All Modules");
    setActiveMethod("ALL");
    setShowAssignedOnly(false);
    try {
      const ids = await permissionRoleApi.getRolePermissions(selectedRoleId);

      setAssignedIds(new Set(ids));
      setDraftIds(new Set(ids));
    } catch (error) {
      console.error(error);
    }
  };

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [roles, selectedRoleId],
  );

  const modules = useMemo(() => getModules(permissions), [permissions]);

  const filteredPerms = useMemo(
    () =>
      permissions.filter((p) => {
        if (activeModule !== "All Modules" && p.module !== activeModule)
          return false;
        if (activeMethod !== "ALL" && p.method !== activeMethod) return false;
        if (permFilter) {
          const q = permFilter.toLowerCase();
          if (
            !p.path.toLowerCase().includes(q) &&
            !p.description.toLowerCase().includes(q) &&
            !p.module.toLowerCase().includes(q)
          )
            return false;
        }
        if (showAssignedOnly && !draftIds.has(p.id)) return false;
        return true;
      }),
    [
      permissions,
      activeModule,
      activeMethod,
      permFilter,
      showAssignedOnly,
      draftIds,
    ],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPerms.length / ITEMS_PER_PAGE),
  );
  const pagedPerms = filteredPerms.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const filteredRoles = useMemo(
    () =>
      roles.filter(
        (r) =>
          !roleSearch ||
          r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
          r.description?.toLowerCase().includes(roleSearch.toLowerCase()),
      ),
    [roles, roleSearch],
  );

  const isDirty = useMemo(() => {
    if (draftIds.size !== assignedIds.size) return true;
    for (const id of draftIds) if (!assignedIds.has(id)) return true;
    return false;
  }, [draftIds, assignedIds]);

  const togglePermission = (id) => {
    setDraftIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setDraftIds((prev) => {
      const n = new Set(prev);
      filteredPerms.forEach((p) => n.add(p.id));
      return n;
    });
  const revokeAll = () =>
    setDraftIds((prev) => {
      const n = new Set(prev);
      filteredPerms.forEach((p) => n.delete(p.id));
      return n;
    });

  const allPageChecked =
    pagedPerms.length > 0 && pagedPerms.every((p) => draftIds.has(p.id));
  const somePageChecked =
    pagedPerms.some((p) => draftIds.has(p.id)) && !allPageChecked;

  const togglePageAll = () => {
    setDraftIds((prev) => {
      const next = new Set(prev);
      if (allPageChecked) pagedPerms.forEach((p) => next.delete(p.id));
      else pagedPerms.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId || !isDirty) return;
    setSaving(true);
    try {
      await permissionRoleApi.saveRolePermissions(selectedRoleId, [
        ...draftIds,
      ]);
      setAssignedIds(new Set(draftIds));
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRoleId
            ? { ...r, permissionCount: draftIds.size }
            : r,
        ),
      );
      showToast("success", "Changes saved successfully.");
    } catch {
      showToast("error", "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) return;
    setCreating(true);
    try {
      const createdId = await permissionRoleApi.createRole(newRole);
      setRoles((prev) => [...prev, { id: createdId, ...newRole }]);
      showToast("success", `Role "${newRole.name}" created.`);
    } catch {
      showToast("error", `Failed to create role. Please try again.`);
    } finally {
      setCreating(false);
      setShowCreateModal(false);
      setNewRole({ name: "", description: "" });
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await permissionRoleApi.deleteRole(roleId);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      showToast("success", `Role deleted successfully.`);
    } catch {
      showToast("error", "Failed to delete role. Please try again.");
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const getPaginationPages = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (page >= totalPages - 3)
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    loadRolePermissions();
  }, [selectedRoleId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <p>Loading roles &amp; permissions…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1>Roles &amp; Permissions Matrix</h1>
        </div>
        <div className={styles.pageHeaderActions}>
          <button
            className={styles.btnOutline}
            onClick={() => setShowCreateModal(true)}
          >
            <MdAdd size={14} />
            Create New Role
          </button>
          <button className={styles.btnOutline}>
            <MdCode size={14} />
            Define API Permission
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div className={styles.contentBody}>
        {/* ── Left: Roles ── */}
        <div className={styles.rolesPanel}>
          <div className={styles.rolesPanelHeader}>
            <div className={styles.rolesPanelTitle}>
              <HiOutlineShieldCheck size={14} />
              System Roles
              <span className={styles.roleBadge}>{roles.length}</span>
            </div>
            <button
              className={styles.addRoleBtn}
              title="Add role"
              onClick={() => setShowCreateModal(true)}
            >
              <MdAdd size={13} />
            </button>
          </div>

          <div className={styles.searchBox}>
            <MdSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search roles (Ctrl+K)…"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
            />
          </div>

          <div className={styles.rolesList}>
            {filteredRoles.map((role) => {
              const isActive = role.id === selectedRoleId;
              const count = isActive ? draftIds.size : role.permissionCount;
              const isAll =
                role.totalPermissions && count === role.totalPermissions;
              return (
                <div
                  key={role.id}
                  className={`${styles.roleItem} ${isActive ? styles.active : ""}`}
                  onClick={() => setSelectedRoleId(role.id)}
                >
                  <div className={styles.roleItemTop}>
                    <div className={styles.roleItemName}>
                      <MdShield size={13} />
                      {role.name}
                      {isActive && (
                        <span className={styles.selectedBadge}>Selected</span>
                      )}
                    </div>
                    <span className={styles.statusActiveBadge}>
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "#3fb950",
                          display: "inline-block",
                        }}
                      />
                      Active
                    </span>
                  </div>
                  <div className={styles.roleItemDesc}>{role.description}</div>
                  <div className={styles.roleItemMeta}>
                    <span>
                      <span
                        className={isAll ? styles.allGranted : styles.permCount}
                      >
                        {count}
                      </span>
                      {role.totalPermissions ? `/${role.totalPermissions}` : ""}{" "}
                      {isAll ? "All Granted" : "Permissions"}
                    </span>
                    <span>
                      {role.accountCount ?? 0}{" "}
                      {role.accountCount === 2 ? "Core Accounts" : "Accounts"}
                    </span>
                  </div>
                  <div className={styles.roleActions}>
                    <button
                      className={styles.roleActionBtn}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MdEdit size={10} /> Edit Role
                    </button>
                    <button
                      className={styles.roleActionBtn}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MdContentCopy size={10} /> Clone
                    </button>
                    <button
                      className={`${styles.roleActionBtn} ${styles.danger}`}
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <MdDelete size={10} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Permissions ── */}
        <div className={styles.permissionsPanel}>
          {/* Panel header row */}
          <div className={styles.permPanelHeader}>
            <div>
              <div className={styles.roleTitleRow}>
                <h2>Role: {selectedRole?.name}</h2>
                {selectedRole?.description && (
                  <span className={styles.roleTitleBadge}>
                    {selectedRole.description}
                  </span>
                )}
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusPill}>
                  <span className={styles.statusDot} />
                  Status: Active
                </span>
                <span className={styles.permEnabledLabel}>
                  <BsCheckCircleFill size={12} color="#3fb950" />
                  <strong>{draftIds.size}</strong>
                  {permissions.length > 0 ? `/${permissions.length}` : ""}{" "}
                  Permissions Enabled
                </span>
              </div>
            </div>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              <MdSave size={14} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            {/* Filter + toggle */}
            <div className={styles.toolbarTop}>
              <div className={styles.filterWrapper}>
                <MdFilterList className={styles.filterIcon} />
                <input
                  className={styles.filterInput}
                  type="text"
                  placeholder="Filter permissions by name, path or method (/api/v1/…)"
                  value={permFilter}
                  onChange={(e) => {
                    setPermFilter(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <label className={styles.toggleLabel}>
                <span className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={showAssignedOnly}
                    onChange={(e) => {
                      setShowAssignedOnly(e.target.checked);
                      setPage(1);
                    }}
                  />
                  <span className={styles.toggleSlider} />
                </span>
                Show Assigned Only
              </label>
            </div>

            {/* Module tabs */}
            <div className={styles.tabsRow}>
              <span className={styles.tabRowLabel}>Module:</span>
              {modules.map((mod) => {
                const count =
                  mod === "All Modules"
                    ? permissions.length
                    : permissions.filter((p) => p.module === mod).length;
                return (
                  <button
                    key={mod}
                    className={`${styles.tab} ${activeModule === mod ? styles.activeTab : ""}`}
                    onClick={() => {
                      setActiveModule(mod);
                      setPage(1);
                    }}
                  >
                    {mod === "All Modules"
                      ? `All Modules (${count})`
                      : `${mod} (${count})`}
                  </button>
                );
              })}
            </div>

            {/* Method filter */}
            <div className={styles.methodsRow}>
              <span className={styles.tabRowLabel}>Method:</span>
              {HTTP_METHODS.map((m) => (
                <button
                  key={m}
                  className={`${styles.methodTab} ${activeMethod === m ? styles.activeMethod : ""}`}
                  onClick={() => {
                    setActiveMethod(m);
                    setPage(1);
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk action bar */}
          <div className={styles.bulkBar}>
            <button className={styles.bulkBtn} onClick={selectAll}>
              <MdSelectAll size={14} /> Select All
            </button>
            <button
              className={`${styles.bulkBtn} ${styles.revoke}`}
              onClick={revokeAll}
            >
              <MdClose size={13} /> Revoke All
            </button>
          </div>

          {/* Permissions table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={allPageChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = somePageChecked;
                      }}
                      onChange={togglePageAll}
                    />
                  </th>
                  <th>Method</th>
                  <th>Path &amp; Permission Identifier</th>
                  <th>Module</th>
                  <th>Scope</th>
                </tr>
              </thead>
              <tbody>
                {pagedPerms.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "#484f58",
                      }}
                    >
                      No permissions match the current filter.
                    </td>
                  </tr>
                ) : (
                  pagedPerms.map((perm) => (
                    <tr key={perm.id}>
                      <td>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={draftIds.has(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                        />
                      </td>
                      <td>
                        <span
                          className={`${styles.methodBadge} ${styles[perm.method]}`}
                        >
                          {perm.method}
                        </span>
                      </td>
                      <td>
                        <div className={styles.pathCell}>
                          <span className={styles.pathMain}>{perm.path}</span>
                          <span className={styles.pathDesc}>
                            {perm.description}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.moduleBadge}>
                          {perm.module}
                        </span>
                      </td>
                      <td>
                        <span className={styles.scopeBadge}>{perm.scope}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <span>
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, filteredPerms.length)} of{" "}
                {filteredPerms.length}
              </span>
              <div className={styles.paginationBtns}>
                <button
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ‹
                </button>
                {getPaginationPages().map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className={styles.pageDots}>
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${page === p ? styles.activePage : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  className={styles.pageBtn}
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowCreateModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>
              <MdAdd size={17} /> Create New Role
            </h3>
            <div className={styles.modalField}>
              <label>Role Name *</label>
              <input
                type="text"
                placeholder="e.g. MODERATOR"
                value={newRole.name}
                onChange={(e) =>
                  setNewRole((p) => ({ ...p, name: e.target.value }))
                }
                autoFocus
              />
            </div>
            <div className={styles.modalField}>
              <label>Description</label>
              <textarea
                rows={3}
                placeholder="Describe what this role can do…"
                value={newRole.description}
                onChange={(e) =>
                  setNewRole((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnOutline}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleCreateRole}
                disabled={!newRole.name.trim() || creating}
              >
                {creating ? "Creating…" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.type === "success" ? (
            <MdCheckCircle size={15} />
          ) : (
            <MdError size={15} />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
